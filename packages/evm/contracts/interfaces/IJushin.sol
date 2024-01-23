// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

/**
 * @title IJushin
 */
interface IJushin {
    /**
     * @dev Handles the incoming message from a specified chain.
     * @param fromChainId - The ID of the origin chain from which the message originates.
     * @param messageId - The unique identifier of the message.
     * @param sender - The address of the sender of the message on the origin chain.
     * @param data - The data contained in the message, in bytes.
     * @return result bytes at the user's choice
     */
    function onMessage(
        uint256 fromChainId,
        uint256 messageId,
        address sender,
        bytes calldata data
    ) external returns (bytes memory);
}
