// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageRelay } from "./interfaces/IMessageRelay.sol";
import { IMessageDispatcher, Message } from "./interfaces/IMessageDispatcher.sol";
import { MessageHashCalculator } from "./utils/MessageHashCalculator.sol";
import { MessageIdCalculator } from "./utils/MessageIdCalculator.sol";

contract Yaho is IMessageDispatcher, MessageHashCalculator, MessageIdCalculator {
    mapping(bytes32 => bytes32) public hashes;
    uint256 private _messageNonce;

    error NoMessageIdsGiven(address emitter);
    error NoAdaptersGiven(address emitter);
    error UnequalArrayLengths(address emitter);
    error MessageHashMismatch(bytes32 messageHash, bytes32 expectedMessageHash);

    /// @dev Dispatches a message using the EIP-5164 standard, putting their into storage and emitting their contents as an event.
    /// @param toChainId The destination chain id.
    /// @param to The target contract.
    /// @param data The message data.
    /// @return messageId A message ID corresponding to the dispatched message.
    function dispatchMessage(
        uint256 toChainId,
        address to,
        bytes calldata data
    ) external payable returns (bytes32 messageId) {
        unchecked {
            messageId = _dispatchMessage(toChainId, to, data, _messageNonce);
            ++_messageNonce;
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
    ) public payable returns (bytes32[] memory) {
        if (toChainIds.length != tos.length || toChainIds.length != data.length)
            revert UnequalArrayLengths(address(this));

        bytes32[] memory messageIds = new bytes32[](toChainIds.length);
        uint256 nonce = _messageNonce;

        for (uint256 i = 0; i < toChainIds.length; ) {
            unchecked {
                messageIds[i] = _dispatchMessage(toChainIds[i], tos[i], data[i], nonce);
                ++nonce;
                ++i;
            }
        }

        _messageNonce = nonce;
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
    ) external payable returns (bytes32[] memory) {
        if (messageIds.length == 0) revert NoMessageIdsGiven(address(this));
        if (adapters.length == 0) revert NoAdaptersGiven(address(this));
        if (messages.length != messageIds.length) revert UnequalArrayLengths(address(this));
        if (adapters.length != destinationAdapters.length) revert UnequalArrayLengths(address(this));

        bytes32[] memory adapterReciepts = new bytes32[](adapters.length);
        uint256[] memory toChainIds = new uint256[](messageIds.length);
        for (uint256 i = 0; i < messageIds.length; i++) {
            bytes32 expectedMessageHash = hashes[messageIds[i]];
            bytes32 messageHash = calculateMessageHash(messageIds[i], messages[i]);
            if (messageHash != expectedMessageHash) revert MessageHashMismatch(messageHash, expectedMessageHash);
            toChainIds[i] = messages[i].toChainId;
        }

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
    ) external payable returns (bytes32[] memory messageIds, bytes32[] memory) {
        if (adapters.length == 0) revert NoAdaptersGiven(address(this));
        messageIds = dispatchMessages(toChainIds, tos, data);
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

        return (messageIds, adapterReciepts);
    }

    function _dispatchMessage(
        uint256 toChainId,
        address to,
        bytes calldata data,
        uint256 nonce
    ) internal returns (bytes32 messageId) {
        messageId = calculateMessageId(block.chainid, address(this), nonce);
        Message memory message = Message(block.chainid, toChainId, msg.sender, to, data);
        hashes[messageId] = calculateMessageHash(messageId, message);
        emit MessageDispatched(messageId, msg.sender, toChainId, to, data);
    }
}
