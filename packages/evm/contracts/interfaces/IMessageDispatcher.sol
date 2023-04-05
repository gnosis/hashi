// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "./IMessage.sol";

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
