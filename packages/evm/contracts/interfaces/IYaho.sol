// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

import { IMessageHashCalculator } from "./IMessageHashCalculator.sol";
import { IMessageIdCalculator } from "./IMessageIdCalculator.sol";
import { Message } from "./IMessage.sol";
import { IReporter } from "./IReporter.sol";
import { IAdapter } from "./IAdapter.sol";

/**
 * @title IYaho
 */
interface IYaho is IMessageHashCalculator, IMessageIdCalculator {
    error NoMessagesGiven();
    error NoMessageIdsGiven();
    error NoReportersGiven();
    error NoAdaptersGiven();
    error UnequalArrayLengths(uint256 arrayOne, uint256 arrayTwo);
    error MessageHashNotFound(uint256 messageId);
    error InvalidMessage(Message message);
    error InvalidThreshold(uint256 threshold, uint256 maxThreshold);

    /**
     * @dev Emitted when a message is dispatched with its associated message ID and message struct.
     * @param messageId - The message ID associated with the dispatched message.
     * @param message - The message struct associated with this event.
     */
    event MessageDispatched(uint256 indexed messageId, Message message);

    /**
     * @dev Dispatches a message to a specified chain with a set of validation parameters without calling the reporters. It just write in storage a commitment of message. In order to dispatch it to the reporters, you must then invoke `relayMessagesToAdapters`
     * @param targetChainId - The ID of the target chain to which the message is being sent.
     * @param threshold - The minimum number of adapters required to have stored the same message.
     * @param receiver - The address of the receiver on the target chain.
     * @param data - The data being sent in the message, represented as a byte array.
     * @param reporters - An array of `IReporter` contracts (not actively used in this step).
     * @param adapters - An array of `IAdapter` contracts (for later validation use).
     * @return messageId A unique identifier for the dispatched message, used for tracking and subsequent validation.
     * @notice If you intend to use a zk adapter, you need to specify only the adapter and utilize address(0) as the reporter, as the adapter will verify the MessageDispatched event emitted by Yaho.
     *
     */
    function dispatchMessage(
        uint256 targetChainId,
        uint256 threshold,
        address receiver,
        bytes calldata data,
        IReporter[] calldata reporters,
        IAdapter[] calldata adapters
    ) external returns (uint256);

    /**
     * @dev Dispatches a message to a specified chain with a set of validation parameters and calls the reporters.
     * @param targetChainId - The ID of the target chain to which the message is being sent.
     * @param threshold - The minimum number of adapters required to have stored the same message.
     * @param receiver - The address of the receiver on the target chain.
     * @param data - The data being sent in the message, represented as a byte array.
     * @param reporters - An array of `IReporter` contracts (not actively used in this step).
     * @param adapters - An array of `IAdapter` contracts (for later validation use).
     * @return (messageId, result) A unique identifier for the dispatched message and an array of byte arrays, where each element is the result of dispatching a respective message to the corresponding Reporter.
     * @notice If you intend to use a zk adapter, you need to specify only the adapter and utilize address(0) as the reporter, as the adapter will verify the MessageDispatched event emitted by Yaho.
     */
    function dispatchMessageToAdapters(
        uint256 targetChainId,
        uint256 threshold,
        address receiver,
        bytes calldata data,
        IReporter[] calldata reporters,
        IAdapter[] calldata adapters
    ) external payable returns (uint256, bytes32[] memory);

    /**
     * @dev Dispatches an array of messages to specified chains and calls the reporters.
     * @param targetChainId - The ID of the target chain for all messages.
     * @param thresholds - An array of minimum validation thresholds required for each message.
     * @param receivers - An array of addresses for the receivers on the target chain, one for each message.
     * @param data - An array of data payloads for each message, represented as byte arrays.
     * @param reporters - An array of `IReporter` contracts for reporting the status of each message.
     * @param adapters - An array of `IAdapter` contracts used for the validation of each message.
     * @return (messageIds, result) An array of unique identifiers for the dispatched messages and an array of bytes32 arrays, where each element is the result of dispatching a respective message to the corresponding Reporter.
     * @notice If you intend to use a zk adapter, you need to specify only the adapter and utilize address(0) as the reporter, as the adapter will verify the MessageDispatched event emitted by Yaho.
     */
    function dispatchMessagesToAdapters(
        uint256 targetChainId,
        uint256[] calldata thresholds,
        address[] calldata receivers,
        bytes[] calldata data,
        IReporter[] calldata reporters,
        IAdapter[] calldata adapters
    ) external payable returns (uint256[] memory, bytes32[] memory);

    /**
     * @dev Retrieves the hash of a pending message that was dispatched via `dispatchMessage` but has not yet been relayed to adapters using `relayingMessagesToAdapters`.
     * @param messageId - The unique identifier of the message for which the hash is being retrieved.
     * @return messageHash The hash of the pending message if it exists.
     */
    function getPendingMessageHash(uint256 messageId) external view returns (bytes32);

    /**
     * @dev Relays an array of messages to their respective adapters. In order to be able to aggregate messages within the reporter, it's mandatory that all messages have the same targetChainId, reporters and adapters.
     * @param messages - An array of `Message` structures to be relayed to the adapters.
     * @return result An array of bytes32 arrays, where each element is the result of dispatching a respective all messages to the corresponding Reporter.
     */
    function relayMessagesToAdapters(Message[] calldata messages) external payable returns (bytes32[] memory);
}
