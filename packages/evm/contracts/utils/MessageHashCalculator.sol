// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Message } from "../interfaces/IMessage.sol";

contract MessageHashCalculator {
    /// @dev Calculates the ID of a given message.
    /// @param chainId ID of the chain on which the message was/will be dispatched.
    /// @param id ID of the message that was/will be dispatched.
    /// @param origin Contract that did/will dispatch the given message.
    /// @param sender Sender of the message that was/will be dispatched.
    /// @param message Message that was/will be dispatched.
    function calculateHash(
        uint256 chainId,
        uint256 id,
        address origin,
        address sender,
        Message memory message
    ) public pure returns (bytes32 calculatedHash) {
        calculatedHash = keccak256(abi.encode(chainId, id, origin, sender, message));
    }
}
