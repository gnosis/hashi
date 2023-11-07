// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IYaho } from "./interfaces/IYaho.sol";
import { IMessageRelay } from "./interfaces/IMessageRelay.sol";
import { Message } from "./interfaces/IMessageDispatcher.sol";
import { MessageHashCalculator } from "./utils/MessageHashCalculator.sol";
import { MessageIdCalculator } from "./utils/MessageIdCalculator.sol";

contract Yaho is IYaho, MessageHashCalculator, MessageIdCalculator {
    bytes32 public constant MESSAGE_BHR = keccak256("MESSAGE_BHR");
    bytes32 public constant MESSAGE_MPI = keccak256("MESSAGE_MPI");

    address public immutable headerReporter;

    mapping(bytes32 => bytes32) public hashes;

    constructor(address headerReporter_) {
        headerReporter = headerReporter_;
    }

    /// @dev Dispatches a message using the EIP-5164 standard, putting their into storage and emitting their contents as an event.
    /// @param toChainId The destination chain id.
    /// @param to The target contract.
    /// @param data The message data.
    /// @return messageId A message ID corresponding to the dispatched message.
    function dispatchMessage(uint256 toChainId, address to, bytes calldata data) external returns (bytes32 messageId) {
        (messageId, ) = _dispatchMessage(toChainId, to, data);
    }

    /// @dev Dispatches a message using the EIP-5164 standard on more chains, putting their into storage and emitting their contents as an event.
    /// @param toChainIds  The destination chain id array.
    /// @param tos The target contracts.
    /// @param data The message data.
    /// @return messageIds An array of message IDs corresponding to the dispatched message.
    function dispatchMessages(
        uint256[] calldata toChainIds,
        address[] calldata tos,
        bytes calldata data
    ) public returns (bytes32[] memory, bytes32[] memory) {
        if (toChainIds.length != tos.length) revert UnequalArrayLengths(address(this));
        bytes32[] memory messageIds = new bytes32[](toChainIds.length);
        bytes32[] memory messageHashes = new bytes32[](toChainIds.length);
        for (uint256 i = 0; i < toChainIds.length; ) {
            (messageIds[i], messageHashes[i]) = _dispatchMessage(toChainIds[i], tos[i], data);
            unchecked {
                ++i;
            }
        }
        return (messageIds, messageHashes);
    }

    /// @dev Dispatches a batch of messages, putting their into storage and emitting their contents as an event.
    /// @param toChainIds The destination chain ids.
    /// @param tos The target contracts.
    /// @param data The message data for each message.
    /// @return messageIds An array of message IDs corresponding to the dispatched messages.
    function dispatchMessages(
        uint256[] calldata toChainIds,
        address[] calldata tos,
        bytes[] calldata data
    ) public returns (bytes32[] memory, bytes32[] memory) {
        if (toChainIds.length != tos.length || toChainIds.length != data.length)
            revert UnequalArrayLengths(address(this));

        bytes32[] memory messageIds = new bytes32[](toChainIds.length);
        bytes32[] memory messageHashes = new bytes32[](toChainIds.length);
        for (uint256 i = 0; i < toChainIds.length; ) {
            (messageIds[i], messageHashes[i]) = _dispatchMessage(toChainIds[i], tos[i], data[i]);

            unchecked {
                ++i;
            }
        }
        return (messageIds, messageHashes);
    }

    /// @dev Relays hashes of the given message ids to the given messageRelays.
    /// @param messages Array of messages to relay to the given messageRelays.
    /// @param messageIds Array of IDs of the message hashes to relay to the given messageRelays.
    /// @param messageRelays Array of relay adapter addresses to which hashes should be relayed.
    /// @param adapters Array of oracle adapter addresses to receive hashes.
    /// @return adapterReciepts Reciepts from each of the relay messageRelays.
    function relayMessagesToAdapters(
        Message[] calldata messages,
        bytes32[] calldata messageIds,
        address[] calldata messageRelays,
        address[] calldata adapters
    ) external payable returns (bytes32[] memory adapterReciepts) {
        if (messageIds.length == 0) revert NoMessageIdsGiven(address(this));
        if (messages.length != messageIds.length) revert UnequalArrayLengths(address(this));

        uint256[] memory toChainIds = new uint256[](messageIds.length);
        bytes32[] memory messageHashes = new bytes32[](messageIds.length);
        for (uint256 i = 0; i < messageIds.length; i++) {
            bytes32 expectedMessageHash = hashes[messageIds[i]];
            messageHashes[i] = calculateMessageHash(messages[i], address(this));
            if (messageHashes[i] != expectedMessageHash)
                revert MessageHashMismatch(messageHashes[i], expectedMessageHash);
            toChainIds[i] = messages[i].toChainId;
        }

        adapterReciepts = _relayMessages(toChainIds, messageIds, messageHashes, messageRelays, adapters);
        return adapterReciepts;
    }

    /// @dev Dispatches an array of messages and relays their hashes to an array of relay messageRelays.
    /// @param toChainIds The destination chain ids.
    /// @param tos The target contracts.
    /// @param data The message data.
    /// @param messageRelays Array of relay adapter addresses to which hashes should be relayed.
    /// @param adapters Array of oracle adapter addresses to receive hashes.
    /// @return messageIds An array of message IDs corresponding to the dispatched messages.
    /// @return adapterReciepts Reciepts from each of the relay messageRelays.
    function dispatchMessagesToAdapters(
        uint256[] calldata toChainIds,
        address[] calldata tos,
        bytes calldata data,
        address[] calldata messageRelays,
        address[] calldata adapters
    ) external payable returns (bytes32[] memory messageIds, bytes32[] memory adapterReciepts) {
        bytes32[] memory messageHashes = new bytes32[](messageIds.length);
        (messageIds, messageHashes) = dispatchMessages(toChainIds, tos, data);
        adapterReciepts = _relayMessages(toChainIds, messageIds, messageHashes, messageRelays, adapters);
        return (messageIds, adapterReciepts);
    }

    /// @dev Dispatches an array of messages and relays their hashes to an array of relay messageRelays.
    /// @param toChainIds The destination chain ids.
    /// @param tos The target contracts.
    /// @param data The message data for each message.
    /// @param messageRelays Array of relay adapter addresses to which hashes should be relayed.
    /// @param adapters Array of oracle adapter addresses to receive hashes.
    /// @return messageIds An array of message IDs corresponding to the dispatched messages.
    /// @return adapterReciepts Reciepts from each of the relay messageRelays.
    function dispatchMessagesToAdapters(
        uint256[] calldata toChainIds,
        address[] calldata tos,
        bytes[] calldata data,
        address[] calldata messageRelays,
        address[] calldata adapters
    ) external payable returns (bytes32[] memory messageIds, bytes32[] memory adapterReciepts) {
        bytes32[] memory messageHashes = new bytes32[](messageIds.length);
        (messageIds, messageHashes) = dispatchMessages(toChainIds, tos, data);
        adapterReciepts = _relayMessages(toChainIds, messageIds, messageHashes, messageRelays, adapters);
        return (messageIds, adapterReciepts);
    }

    function _dispatchMessage(
        uint256 toChainId,
        address to,
        bytes calldata data
    ) internal returns (bytes32 messageId, bytes32 messageHash) {
        bool isHeaderReporter = msg.sender == headerReporter;
        address from = isHeaderReporter ? address(0) : msg.sender;
        // NOTE: in case of isHeaderReporter = true -> to = address(0)
        Message memory message = Message(block.chainid, toChainId, from, to, data);
        messageHash = calculateMessageHash(message, address(this));
        bytes32 salt = keccak256(
            abi.encode(
                isHeaderReporter ? MESSAGE_BHR : MESSAGE_MPI,
                isHeaderReporter ? bytes(abi.encode(0)) : abi.encode(blockhash(block.number), gasleft())
            )
        );
        messageId = calculateMessageId(salt, messageHash);
        hashes[messageId] = messageHash;
        emit MessageDispatched(messageId, from, toChainId, to, data);
    }

    function _relayMessages(
        uint256[] memory toChainIds,
        bytes32[] memory messageIds,
        bytes32[] memory messageHashes,
        address[] calldata messageRelays,
        address[] calldata adapters
    ) internal returns (bytes32[] memory) {
        if (messageRelays.length == 0) revert NoMessageRelaysGiven(address(this));
        if (adapters.length == 0) revert NoAdaptersGiven(address(this));
        if (messageRelays.length != adapters.length) revert UnequalArrayLengths(address(this));

        bytes32[] memory adapterReciepts = new bytes32[](messageRelays.length);
        for (uint256 i = 0; i < messageRelays.length; ) {
            adapterReciepts[i] = IMessageRelay(messageRelays[i]).relayMessages(
                toChainIds,
                messageIds,
                messageHashes,
                adapters[i]
            );
            unchecked {
                ++i;
            }
        }
        return adapterReciepts;
    }
}
