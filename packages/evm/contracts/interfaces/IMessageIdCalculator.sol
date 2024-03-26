// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

/**
 * @title IMessageIdCalculator
 */
interface IMessageIdCalculator {
    /**
     * @dev Calculates and returns a unique identifier (ID) for a message.
     *
     * @param sourceChainId - The ID of the chain from which the message originates.
     * @param dispatcherAddress - The address of the dispatcher sending the message.
     * @param messageHash - The keccak256 hash of the message, represented as a 32-byte hexadecimal string.
     * @return messageId The unique identifier for the message, calculated based on the input parameters.
     */
    function calculateMessageId(
        uint256 sourceChainId,
        address dispatcherAddress,
        bytes32 messageHash
    ) external pure returns (uint256);
}
