// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageRelay } from "./interfaces/IMessageRelay.sol";
import { IMessageDispatcher, Message } from "./interfaces/IMessageDispatcher.sol";
import { MessageHashCalculator } from "./utils/MessageHashCalculator.sol";
import { MessageIdCalculator } from "./utils/MessageIdCalculator.sol";

contract Yaho is IMessageDispatcher, MessageHashCalculator, MessageIdCalculator {
    mapping(bytes32 => bytes32) public hashes;
    uint256 private messageNonce;

    error NoMessageIdsGiven(address emitter);
    error NoAdaptersGiven(address emitter);
    error UnequalArrayLengths(address emitter);

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
            Message memory message = Message({
                from: msg.sender,
                to: to,
                fromChainId: block.chainid,
                toChainId: toChainId,
                data: data
            });
            messageId = calculateMessageId(block.chainid, address(this), messageNonce);
            hashes[messageId] = calculateMessageHash(messageId, message);
            emit MessageDispatched(messageId, msg.sender, toChainId, to, data);
            ++messageNonce;
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

        uint256 currentMessageNonce = messageNonce;
        for (uint256 i = 0; i < toChainIds.length; ) {
            unchecked {
                Message memory message = Message({
                    from: msg.sender,
                    to: tos[i],
                    fromChainId: block.chainid,
                    toChainId: toChainIds[i],
                    data: data[i]
                });

                bytes32 messageId = calculateMessageId(block.chainid, address(this), currentMessageNonce);
                hashes[messageId] = calculateMessageHash(messageId, message);
                messageIds[i] = messageId;
                emit MessageDispatched(messageId, msg.sender, message.toChainId, message.to, message.data);
                ++currentMessageNonce;
                ++i;
            }
        }

        messageNonce = currentMessageNonce;
        return messageIds;
    }

    /// @dev Relays hashes of the given messageIds to the given adapters.
    /// @param messageIds Array of IDs of the message hashes to relay to the given adapters.
    /// @param adapters Array of relay adapter addresses to which hashes should be relayed.
    /// @param destinationAdapters Array of oracle adapter addresses to receive hashes.
    /// @return adapterReciepts Reciepts from each of the relay adapters.
    function relayMessagesToAdapters(
        bytes32[] memory messageIds,
        address[] memory adapters,
        address[] memory destinationAdapters
    ) external payable returns (bytes32[] memory) {
        if (messageIds.length == 0) revert NoMessageIdsGiven(address(this));
        if (adapters.length == 0) revert NoAdaptersGiven(address(this));
        if (adapters.length != destinationAdapters.length) revert UnequalArrayLengths(address(this));
        bytes32[] memory adapterReciepts = new bytes32[](adapters.length);
        for (uint256 i = 0; i < adapters.length; i++) {
            adapterReciepts[i] = IMessageRelay(adapters[i]).relayMessages(messageIds, destinationAdapters[i]);
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
        address[] memory adapters,
        address[] memory destinationAdapters
    ) external payable returns (bytes32[] memory messageIds, bytes32[] memory) {
        if (adapters.length == 0) revert NoAdaptersGiven(address(this));
        messageIds = dispatchMessages(toChainIds, tos, data);
        bytes32[] memory adapterReciepts = new bytes32[](adapters.length);
        for (uint256 i = 0; i < adapters.length; i++) {
            adapterReciepts[i] = IMessageRelay(adapters[i]).relayMessages(messageIds, destinationAdapters[i]);
        }
        return (messageIds, adapterReciepts);
    }
}
