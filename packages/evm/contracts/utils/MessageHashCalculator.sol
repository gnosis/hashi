// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Message } from "../interfaces/IMessage.sol";

contract MessageHashCalculator {
    /// @dev Calculates the hash of a given message.
    /// @param message Message that was/will be dispatched.
    function calculateMessageHash(Message memory message) public pure returns (bytes32) {
        return keccak256(abi.encode(message));
    }
}
