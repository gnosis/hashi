// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Message } from "./IMessage.sol";

interface IMessageHashCalculator {
    function calculateMessageHash(Message memory message) external pure returns (bytes32);
}
