// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

struct Message {
    address to;
    uint256 toChainId;
    bytes data;
}

interface MessageDispatcher {
    event MessageDispatched(
        bytes32 indexed messageId,
        address indexed from,
        uint256 indexed toChainId,
        address to,
        bytes data
    );

    function dispatchMessages(Message[] memory messages) external payable returns (bytes32[] memory messageIds);
}

contract YahoBashi is MessageDispatcher {
    mapping(bytes32 => address) public senders;
    mapping(bytes32 => Message) public messages;
    uint256 private nonce;

    function dispatchMessages(Message[] memory _messages) external payable returns (bytes32[] memory messageIds) {
        for (uint i = 0; i < _messages.length; i++) {
            bytes32 messageId = keccak256(abi.encode(nonce, msg.sender, _messages[i]));
            messageIds[i] = messageId;
            messages[messageId] = _messages[i];
            senders[messageId] = msg.sender;
            emit MessageDispatched(messageId, msg.sender, _messages[i].toChainId, _messages[i].to, _messages[i].data);
            nonce++;
        }
    }
}
