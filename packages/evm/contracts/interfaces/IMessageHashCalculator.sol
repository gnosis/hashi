// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Message } from "./IMessage.sol";

/**
 * @title IMessageHashCalculator
 */
interface IMessageHashCalculator {
    /**
     * @dev Calculates and returns the hash of a given message.
     * @param message - The `Message` structure containing various fields to be hashed.
     * @return hash The keccak256 hash of the message, represented as a 32-byte hexadecimal string.
     */
    function calculateMessageHash(Message memory message) external pure returns (bytes32);
}
