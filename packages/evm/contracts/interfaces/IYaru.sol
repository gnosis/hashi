// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Message } from "./IMessage.sol";
import { IMessageHashCalculator } from "./IMessageHashCalculator.sol";
import { IMessageIdCalculator } from "./IMessageIdCalculator.sol";

/**
 * @title IYaru
 */
interface IYaru is IMessageHashCalculator, IMessageIdCalculator {
    error InvalidToChainId(uint256 chainId, uint256 expectedChainId);
    error MessageIdAlreadyExecuted(uint256 messageId);
    error CallFailed();
    error ThresholdNotMet();

    event MessageExecuted(uint256 indexed messageId, Message message);

    /**
     * @dev Executes a batch of messages and returns the results if the threshold for a single message has been reached
     * @param messages - An array of `Message` structures
     * @return result An array of byte arrays, where each byte array is the result of executing a respective message from the input.
     */
    function executeMessages(Message[] calldata messages) external returns (bytes[] memory);
}
