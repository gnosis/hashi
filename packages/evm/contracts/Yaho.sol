// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { MessageIdCalculator } from "./utils/MessageIdCalculator.sol";
import { MessageHashCalculator } from "./utils/MessageHashCalculator.sol";
import { IYaho } from "./interfaces/IYaho.sol";
import { IReporter } from "./interfaces/IReporter.sol";
import { Message } from "./interfaces/IMessage.sol";
import { IAdapter } from "./interfaces/IAdapter.sol";

contract Yaho is IYaho, MessageIdCalculator, MessageHashCalculator {
    mapping(uint256 => bytes32) private _pendingMessageHashes;
    uint256 public currentNonce;

    /// @inheritdoc IYaho
    function dispatchMessage(
        uint256 targetChainId,
        uint256 threshold,
        address receiver,
        bytes calldata data,
        IReporter[] calldata reporters,
        IAdapter[] calldata adapters
    ) external returns (uint256) {
        _checkReportersAndAdapters(threshold, reporters, adapters);
        (uint256 messageId, ) = _dispatchMessage(targetChainId, threshold, receiver, data, reporters, adapters);
        return messageId;
    }

    /// @inheritdoc IYaho
    function dispatchMessageToAdapters(
        uint256 targetChainId,
        uint256 threshold,
        address receiver,
        bytes calldata data,
        IReporter[] calldata reporters,
        IAdapter[] calldata adapters
    ) external payable returns (uint256, bytes32[] memory) {
        _checkReportersAndAdapters(threshold, reporters, adapters);
        (uint256 messageId, bytes32 messageHash) = _dispatchMessage(
            targetChainId,
            threshold,
            receiver,
            data,
            reporters,
            adapters
        );
        bytes32[] memory reportersReceipts = _dispatchMessageToAdapters(
            targetChainId,
            messageId,
            messageHash,
            reporters,
            adapters
        );
        return (messageId, reportersReceipts);
    }

    /// @inheritdoc IYaho
    function dispatchMessagesToAdapters(
        uint256 targetChainId,
        uint256[] calldata thresholds,
        address[] calldata receivers,
        bytes[] calldata data,
        IReporter[] calldata reporters,
        IAdapter[] calldata adapters
    ) external payable returns (uint256[] memory, bytes32[] memory) {
        if (thresholds.length != receivers.length) revert UnequalArrayLengths(thresholds.length, receivers.length);
        if (thresholds.length != data.length) revert UnequalArrayLengths(thresholds.length, data.length);

        uint256[] memory messageIds = new uint256[](receivers.length);
        bytes32[] memory messageHashes = new bytes32[](receivers.length);
        for (uint256 i = 0; i < receivers.length; ) {
            _checkReportersAndAdapters(thresholds[i], reporters, adapters);
            (messageIds[i], messageHashes[i]) = _dispatchMessage(
                targetChainId,
                thresholds[i],
                receivers[i],
                data[i],
                reporters,
                adapters
            );
            unchecked {
                ++i;
            }
        }

        bytes32[] memory reportersReceipts = new bytes32[](reporters.length);
        _resetPendingMessageHashesByMessageIds(messageIds);
        reportersReceipts = _dispatchMessagesToAdapters(targetChainId, messageIds, messageHashes, reporters, adapters);
        return (messageIds, reportersReceipts);
    }

    /// @inheritdoc IYaho
    function getPendingMessageHash(uint256 messageId) external view returns (bytes32) {
        return _pendingMessageHashes[messageId];
    }

    /// @inheritdoc IYaho
    function relayMessagesToAdapters(Message[] calldata messages) external payable returns (bytes32[] memory) {
        if (messages.length == 0) revert NoMessagesGiven();

        bytes32 expectedParams = keccak256(
            abi.encode(messages[0].targetChainId, messages[0].reporters, messages[0].adapters)
        );

        bytes32[] memory messageHashes = new bytes32[](messages.length);
        uint256[] memory messageIds = new uint256[](messages.length);
        for (uint256 i = 0; i < messages.length; i++) {
            Message memory message = messages[i];
            if (
                i > 0 &&
                expectedParams != keccak256(abi.encode(message.targetChainId, message.reporters, message.adapters))
            ) revert InvalidMessage(message);
            uint256 messageId = calculateMessageId(block.chainid, address(this), calculateMessageHash(message));
            bytes32 messageHash = _pendingMessageHashes[messageId];
            if (messageHash == bytes32(0)) revert MessageHashNotFound(messageId);
            messageHashes[i] = messageHash;
            messageIds[i] = messageId;
            delete _pendingMessageHashes[messageId];
        }

        return
            _dispatchMessagesToAdapters(
                messages[0].targetChainId,
                messageIds,
                messageHashes,
                messages[0].reporters,
                messages[0].adapters
            );
    }

    function _checkReportersAndAdapters(
        uint256 threshold,
        IReporter[] calldata reporters,
        IAdapter[] calldata adapters
    ) internal pure {
        if (reporters.length == 0) revert NoReportersGiven();
        if (adapters.length == 0) revert NoAdaptersGiven();
        if (reporters.length != adapters.length) revert UnequalArrayLengths(reporters.length, adapters.length);
        if (threshold > reporters.length || threshold == 0) revert InvalidThreshold(threshold, reporters.length);
    }

    function _dispatchMessage(
        uint256 targetChainId,
        uint256 threshold,
        address receiver,
        bytes calldata data,
        IReporter[] calldata reporters,
        IAdapter[] calldata adapters
    ) internal returns (uint256, bytes32) {
        address sender = msg.sender;
        Message memory message = Message(
            currentNonce,
            targetChainId,
            threshold,
            sender,
            receiver,
            data,
            reporters,
            adapters
        );
        bytes32 messageHash = calculateMessageHash(message);
        uint256 messageId = calculateMessageId(block.chainid, address(this), messageHash);
        _pendingMessageHashes[messageId] = messageHash;
        unchecked {
            ++currentNonce;
        }
        emit MessageDispatched(messageId, message);
        return (messageId, messageHash);
    }

    function _dispatchMessageToAdapters(
        uint256 targetChainId,
        uint256 messageId,
        bytes32 messageHash,
        IReporter[] memory reporters,
        IAdapter[] memory adapters
    ) internal returns (bytes32[] memory) {
        uint256[] memory messageIds = new uint256[](1);
        bytes32[] memory messageHashes = new bytes32[](1);
        messageIds[0] = messageId;
        messageHashes[0] = messageHash;
        _resetPendingMessageHashesByMessageIds(messageIds);
        return _dispatchMessagesToAdapters(targetChainId, messageIds, messageHashes, reporters, adapters);
    }

    function _dispatchMessagesToAdapters(
        uint256 targetChainId,
        uint256[] memory messageIds,
        bytes32[] memory messageHashes,
        IReporter[] memory reporters,
        IAdapter[] memory adapters
    ) internal returns (bytes32[] memory) {
        bytes32[] memory reportersReceipts = new bytes32[](reporters.length);

        for (uint256 i = 0; i < reporters.length; ) {
            reportersReceipts[i] = reporters[i].dispatchMessages(targetChainId, adapters[i], messageIds, messageHashes);
            unchecked {
                ++i;
            }
        }

        return reportersReceipts;
    }

    function _resetPendingMessageHashesByMessageIds(uint256[] memory messageIds) internal {
        for (uint256 i = 0; i < messageIds.length; ) {
            delete _pendingMessageHashes[messageIds[i]];
            unchecked {
                ++i;
            }
        }
    }
}
