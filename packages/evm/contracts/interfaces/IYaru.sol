// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Message } from "./IMessage.sol";
import { IMessageHashCalculator } from "./IMessageHashCalculator.sol";
import { IMessageIdCalculator } from "./IMessageIdCalculator.sol";

interface IYaru is IMessageHashCalculator, IMessageIdCalculator {
    error InvalidToChainId(uint256 chainId, uint256 expectedChainId);
    error MessageIdAlreadyExecuted(uint256 messageId);
    error CallFailed();
    error ThresholdNotMet();

    event MessageExecuted(uint256 indexed messageId, Message message);

    function executeMessages(Message[] calldata messages) external returns (bytes[] memory);
}
