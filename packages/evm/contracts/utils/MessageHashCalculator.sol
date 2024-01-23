// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageHashCalculator } from "../interfaces/IMessageHashCalculator.sol";
import { Message } from "../interfaces/IMessage.sol";

contract MessageHashCalculator is IMessageHashCalculator {
    /// @inheritdoc IMessageHashCalculator
    function calculateMessageHash(Message memory message) public pure returns (bytes32) {
        return keccak256(abi.encode(message));
    }
}
