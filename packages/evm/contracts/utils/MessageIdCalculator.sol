// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Message } from "../interfaces/IMessage.sol";

contract MessageIdCalculator {
    /// @dev Calculates the ID of a given message.
    /// @param chainId ID of the chain on which the message was/will be dispatched.
    /// @param dispatcherAddress Contract that did/will dispatch the given message.
    /// @param messageType Type of the message.
    /// @param salt Message salt.
    /// @param messageHash Message Hash that was/will be dispatched.
    function calculateMessageId(
        uint256 chainId,
        address dispatcherAddress,
        bytes32 messageType,
        bytes32 salt,
        bytes32 messageHash
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(chainId, dispatcherAddress, messageType, salt, messageHash));
    }
}
