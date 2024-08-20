// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

import { IAdapter } from "./IAdapter.sol";

/**
 * @title IJushin
 */
interface IJushin {
    /**
     * @dev Handles the incoming message from a specified chain.
     * @param messageId - The unique identifier of the message.
     * @param sourceChainId - The ID of the origin chain from which the message originates.
     * @param sender - The address of the sender of the message on the origin chain.
     * @param threshold - The minimum number of adapters required to have stored the same message.
     * @param data - The data contained in the message, in bytes.
     * @param adapters - An array of `IAdapter` contracts.
     * @return result bytes at the user's choice
     */
    function onMessage(
        uint256 messageId,
        uint256 sourceChainId,
        address sender,
        uint256 threshold,
        IAdapter[] calldata adapters,
        bytes calldata data
    ) external returns (bytes memory);
}
