// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "./adapters/interfaces/IMessageRelay.sol";
import "./adapters/interfaces/IMessageDispatcher.sol";

contract Yaho is MessageDispatcher {
    mapping(uint256 => bytes32) public hashes;
    // mapping(bytes32 => Message) public sentMessages;
    uint256 private count;

    function dispatchMessages(Message[] memory messages) public payable returns (bytes32[] memory messageIds) {
        for (uint i = 0; i < messages.length; i++) {
            uint256 id = count;
            hashes[id] = keccak256(abi.encode(id, address(this), msg.sender, messages[i]));
            messageIds[i] = bytes32(id);
            // sentMessages[] = messages[i];
            emit MessageDispatched(bytes32(id), msg.sender, messages[i].toChainId, messages[i].to, messages[i].data);
            count++;
        }
    }

    function relayMessagesToAdapters(
        bytes32[] memory messageIds,
        address[] memory adapters
    ) external payable returns (bytes32[] memory adapterReciepts) {
        for (uint i = 0; i < adapters.length; i++) {
            adapterReciepts[i] = MessageRelay(adapters[i]).relayMessages(messageIds);
        }
    }

    function dispatchMessagesToAdaters(
        Message[] memory messages,
        address[] memory adapters
    ) external payable returns (bytes32[] memory messageIds, bytes32[] memory adapterReciepts) {
        messageIds = dispatchMessages(messages);
        for (uint i = 0; i < adapters.length; i++) {
            adapterReciepts[i] = MessageRelay(adapters[i]).relayMessages(messageIds);
        }
    }
}
