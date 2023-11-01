// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

contract MessageIdCalculator {
    /// @dev Calculates the ID of a given message.
    /// @param chainId ID of the chain on which the message was/will be dispatched.
    /// @param dispatcherAddress Contract that did/will dispatch the given message.
    /// @param messageNonce Message nonce.
    function calculateMessageId(
        uint256 chainId,
        address dispatcherAddress,
        uint256 messageNonce
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(chainId, dispatcherAddress, messageNonce));
    }
}
