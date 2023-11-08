// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Message } from "../interfaces/IMessage.sol";

contract MessageIdCalculator {
    /// @dev Calculates the ID of a given message.
    /// @param fromChainId Source chain id
    /// @param dispatcherAddress Source chain id
    /// @param salt Message salt.
    function calculateMessageId(
        uint256 fromChainId,
        address dispatcherAddress,
        bytes32 salt
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(fromChainId, dispatcherAddress, salt));
    }
}
