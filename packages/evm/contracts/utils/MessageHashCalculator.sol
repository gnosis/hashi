// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Message } from "../interfaces/IMessage.sol";

contract MessageHashCalculator {
    /// @dev Calculates the hash of a given message.
    /// @param messageId ID of the message that was/will be dispatched.
    /// @param message Message that was/will be dispatched.
    function calculateMessageHash(bytes32 messageId, Message memory message) public pure returns (bytes32) {
        return keccak256(abi.encode(messageId, message));
    }
}
