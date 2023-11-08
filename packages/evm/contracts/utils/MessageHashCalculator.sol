// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Message } from "../interfaces/IMessage.sol";

contract MessageHashCalculator {
    /// @dev Calculates the hash of a given message.
    /// @param message Message that was/will be dispatched.
    /// @param messageId Message if of the message that will be dispatched.
    /// @param dispatcherAddress Contract that did/will dispatch the given message.
    function calculateMessageHash(
        Message memory message,
        bytes32 messageId,
        address dispatcherAddress
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(message, messageId, dispatcherAddress));
    }
}
