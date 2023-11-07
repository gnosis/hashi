// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageExecutor } from "./IMessageExecutor.sol";
import { Message } from "./IMessage.sol";
import { IOracleAdapter } from "./IHashi.sol";

interface IYaru is IMessageExecutor {
    event Initialized(uint256 indexed chainId, address yaho);

    function executeMessages(
        Message[] calldata messages,
        bytes32[] calldata messageIds,
        IOracleAdapter[] calldata oracleAdapters
    ) external returns (bytes[] memory);

    function initializeForChainId(uint256 chainId, address yaho) external;
}
