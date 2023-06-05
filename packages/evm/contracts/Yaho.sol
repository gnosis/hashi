// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageRelay } from "./interfaces/IMessageRelay.sol";
import { IMessageDispatcher, Message } from "./interfaces/IMessageDispatcher.sol";
import { MessageHashCalculator } from "./utils/MessageHashCalculator.sol";

contract Yaho is IMessageDispatcher, MessageHashCalculator {
    mapping(uint256 => bytes32) public hashes;
    uint256 private count;

    error NoMessagesGiven(address emitter);
    error NoMessageIdsGiven(address emitter);
    error NoAdaptersGiven(address emitter);
    error UnequalArrayLengths(address emitter);

    /// @dev Dispatches a batch of messages, putting their into storage and emitting their contents as an event.
    /// @param messages An array of Messages to be dispatched.
    /// @return messageIds An array of message IDs corresponding to the dispatched messages.
    function dispatchMessages(Message[] memory messages) public payable returns (bytes32[] memory) {
        if (messages.length == 0) revert NoMessagesGiven(address(this));
        bytes32[] memory messageIds = new bytes32[](messages.length);
        for (uint256 i = 0; i < messages.length; i++) {
            uint256 id = count;
            hashes[id] = calculateHash(block.chainid, id, address(this), msg.sender, messages[i]);
            messageIds[i] = bytes32(id);
            emit MessageDispatched(bytes32(id), msg.sender, messages[i].toChainId, messages[i].to, messages[i].data);
            count++;
        }
        return messageIds;
    }

    /// @dev Relays hashes of the given messageIds to the given adapters.
    /// @param messageIds Array of IDs of the message hashes to relay to the given adapters.
    /// @param adapters Array of relay adapter addresses to which hashes should be relayed.
    /// @param destinationAdapters Array of oracle adapter addresses to receive hashes.
    /// @return adapterReciepts Reciepts from each of the relay adapters.
    function relayMessagesToAdapters(
        uint256[] memory messageIds,
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
    /// @param messages An array of Messages to be dispatched.
    /// @param adapters Array of relay adapter addresses to which hashes should be relayed.
    /// @param destinationAdapters Array of oracle adapter addresses to receive hashes.
    /// @return messageIds An array of message IDs corresponding to the dispatched messages.
    /// @return adapterReciepts Reciepts from each of the relay adapters.
    function dispatchMessagesToAdapters(
        Message[] memory messages,
        address[] memory adapters,
        address[] memory destinationAdapters
    ) external payable returns (bytes32[] memory messageIds, bytes32[] memory) {
        if (adapters.length == 0) revert NoAdaptersGiven(address(this));
        messageIds = dispatchMessages(messages);
        uint256[] memory uintIds = new uint256[](messageIds.length);
        for (uint256 i = 0; i < messageIds.length; i++) {
            uintIds[i] = uint256(messageIds[i]);
        }
        bytes32[] memory adapterReciepts = new bytes32[](adapters.length);
        for (uint256 i = 0; i < adapters.length; i++) {
            adapterReciepts[i] = IMessageRelay(adapters[i]).relayMessages(uintIds, destinationAdapters[i]);
        }
        return (messageIds, adapterReciepts);
    }
}
