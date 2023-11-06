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

    error NoMessageIdsGiven(address emitter);
    error NoAdaptersGiven(address emitter);
    error UnequalArrayLengths(address emitter);
    error MessageHashMismatch(bytes32 messageHash, bytes32 expectedMessageHash);

    constructor(address headerReporter_) {
        headerReporter = headerReporter_;
    }

    /// @dev Dispatches a message using the EIP-5164 standard, putting their into storage and emitting their contents as an event.
    /// @param toChainId The destination chain id.
    /// @param to The target contract.
    /// @param data The message data.
    /// @return messageId A message ID corresponding to the dispatched message.
    function dispatchMessage(uint256 toChainId, address to, bytes calldata data) external returns (bytes32 messageId) {
        messageId = _dispatchMessage(toChainId, to, data);
    }

    /// @dev Dispatches a message using the EIP-5164 standard on more chains, putting their into storage and emitting their contents as an event.
    /// @param toChainIds  The destination chain id array.
    /// @param tos The target contracts.
    /// @param data The message data.
    /// @return messageIds An array of message IDs corresponding to the dispatched message.
    function dispatchMessage(
        uint256[] calldata toChainIds,
        address[] calldata tos,
        bytes calldata data
    ) public returns (bytes32[] memory messageIds) {
        for (uint256 i = 0; i < toChainIds.length; ) {
            messageIds[i] = _dispatchMessage(toChainIds[i], tos[i], data);
            unchecked {
                ++i;
            }
        }
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
    ) public returns (bytes32[] memory) {
        if (toChainIds.length != tos.length || toChainIds.length != data.length)
            revert UnequalArrayLengths(address(this));

        bytes32[] memory messageIds = new bytes32[](toChainIds.length);
        for (uint256 i = 0; i < toChainIds.length; ) {
            messageIds[i] = _dispatchMessage(toChainIds[i], tos[i], data[i]);

            unchecked {
                ++i;
            }
        }
        return messageIds;
    }

    /// @dev Relays hashes of the given message ids to the given adapters.
    /// @param messages Array of messages to relay to the given adapters.
    /// @param messageIds Array of IDs of the message hashes to relay to the given adapters.
    /// @param adapters Array of relay adapter addresses to which hashes should be relayed.
    /// @param destinationAdapters Array of oracle adapter addresses to receive hashes.
    /// @return adapterReciepts Reciepts from each of the relay adapters.
    function relayMessagesToAdapters(
        Message[] calldata messages,
        bytes32[] calldata messageIds,
        address[] calldata adapters,
        address[] calldata destinationAdapters
    ) external payable returns (bytes32[] memory adapterReciepts) {
        if (messageIds.length == 0) revert NoMessageIdsGiven(address(this));
        if (adapters.length == 0) revert NoAdaptersGiven(address(this));
        if (messages.length != messageIds.length) revert UnequalArrayLengths(address(this));
        if (adapters.length != destinationAdapters.length) revert UnequalArrayLengths(address(this));

        uint256[] memory toChainIds = new uint256[](messageIds.length);
        for (uint256 i = 0; i < messageIds.length; i++) {
            bytes32 expectedMessageHash = hashes[messageIds[i]];
            bytes32 messageHash = calculateMessageHash(messages[i]);
            if (messageHash != expectedMessageHash) revert MessageHashMismatch(messageHash, expectedMessageHash);
            toChainIds[i] = messages[i].toChainId;
        }

        adapterReciepts = _relayMessages(messageIds, toChainIds, adapters, destinationAdapters);
        return adapterReciepts;
    }

    /// @dev Dispatches an array of messages and relays their hashes to an array of relay adapters.
    /// @param toChainIds The destination chain ids.
    /// @param tos The target contracts.
    /// @param data The message data.
    /// @param adapters Array of relay adapter addresses to which hashes should be relayed.
    /// @param destinationAdapters Array of oracle adapter addresses to receive hashes.
    /// @return messageIds An array of message IDs corresponding to the dispatched messages.
    /// @return adapterReciepts Reciepts from each of the relay adapters.
    function dispatchMessageToAdapters(
        uint256[] calldata toChainIds,
        address[] calldata tos,
        bytes calldata data,
        address[] calldata adapters,
        address[] calldata destinationAdapters
    ) external payable returns (bytes32[] memory messageIds, bytes32[] memory adapterReciepts) {
        if (adapters.length == 0) revert NoAdaptersGiven(address(this));
        messageIds = dispatchMessage(toChainIds, tos, data);
        adapterReciepts = _relayMessages(messageIds, toChainIds, adapters, destinationAdapters);
        return (messageIds, adapterReciepts);
    }

    /// @dev Dispatches an array of messages and relays their hashes to an array of relay adapters.
    /// @param toChainIds The destination chain ids.
    /// @param tos The target contracts.
    /// @param data The message data for each message.
    /// @param adapters Array of relay adapter addresses to which hashes should be relayed.
    /// @param destinationAdapters Array of oracle adapter addresses to receive hashes.
    /// @return messageIds An array of message IDs corresponding to the dispatched messages.
    /// @return adapterReciepts Reciepts from each of the relay adapters.
    function dispatchMessagesToAdapters(
        uint256[] calldata toChainIds,
        address[] calldata tos,
        bytes[] calldata data,
        address[] calldata adapters,
        address[] calldata destinationAdapters
    ) external payable returns (bytes32[] memory messageIds, bytes32[] memory adapterReciepts) {
        if (adapters.length == 0) revert NoAdaptersGiven(address(this));
        messageIds = dispatchMessages(toChainIds, tos, data);
        adapterReciepts = _relayMessages(messageIds, toChainIds, adapters, destinationAdapters);
        return (messageIds, adapterReciepts);
    }

    function _dispatchMessage(uint256 toChainId, address to, bytes calldata data) internal returns (bytes32 messageId) {
        Message memory message = Message(block.chainid, toChainId, msg.sender, to, data);

        bytes32 messageHash = calculateMessageHash(message);
        bool isHeaderReporter = msg.sender == headerReporter;
        bytes32 messageType = isHeaderReporter ? MESSAGE_BHR : MESSAGE_MPI;
        bytes32 salt = isHeaderReporter ? bytes32(0) : keccak256(abi.encode(blockhash(block.number), gasleft()));

        messageId = calculateMessageId(block.chainid, address(this), messageType, salt, messageHash);
        hashes[messageId] = messageHash;
        emit MessageDispatched(messageId, msg.sender, toChainId, to, data);
    }

    function _relayMessages(
        bytes32[] memory messageIds,
        uint256[] memory toChainIds,
        address[] calldata adapters,
        address[] calldata destinationAdapters
    ) internal returns (bytes32[] memory) {
        bytes32[] memory adapterReciepts = new bytes32[](adapters.length);
        for (uint256 i = 0; i < adapters.length; ) {
            adapterReciepts[i] = IMessageRelay(adapters[i]).relayMessages(
                messageIds,
                toChainIds,
                destinationAdapters[i]
            );
            unchecked {
                ++i;
            }
        }
        return adapterReciepts;
    }
}
