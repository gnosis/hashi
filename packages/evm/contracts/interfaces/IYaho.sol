// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageHashCalculator } from "./IMessageHashCalculator.sol";
import { IMessageIdCalculator } from "./IMessageIdCalculator.sol";
import { Message } from "./IMessage.sol";
import { IOracleAdapter } from "./IOracleAdapter.sol";

interface IYaho is IMessageHashCalculator, IMessageIdCalculator {
    error NoMessagesGiven();
    error NoMessageIdsGiven();
    error NoReportersGiven();
    error NoAdaptersGiven();
    error UnequalArrayLengths(uint256 arrayOne, uint256 arrayTwo);
    error MessageHashNotFound(uint256 messageId);
    error InvalidMessage(Message message);
    error InvalidThreshold(uint256 threshold, uint256 maxThreshold);

    event MessageDispatched(uint256 indexed messageId, Message message);

    function dispatchMessage(
        uint256 toChainId,
        uint256 threshold,
        address receiver,
        bytes calldata data,
        address[] calldata reporters,
        IOracleAdapter[] calldata adapters
    ) external returns (uint256);

    function dispatchMessageToAdapters(
        uint256 toChainId,
        uint256 threshold,
        address receiver,
        bytes calldata data,
        address[] calldata reporters,
        IOracleAdapter[] calldata adapters
    ) external returns (uint256, bytes32[] memory);

    function dispatchMessagesToAdapters(
        uint256 toChainId,
        uint256[] calldata thresholds,
        address[] calldata receivers,
        bytes[] calldata data,
        address[] calldata reporters,
        IOracleAdapter[] calldata adapters
    ) external payable returns (uint256[] memory, bytes32[] memory);

    function getPendingMessageHash(uint256 messageId) external view returns (bytes32);

    function relayMessagesToAdapters(Message[] calldata messages) external payable returns (bytes32[] memory);
}
