// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

interface IMessageExecutor {
    event MessageIdExecuted(uint256 indexed fromChainId, bytes32 indexed messageId);
}
