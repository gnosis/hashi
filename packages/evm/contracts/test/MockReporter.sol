// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Reporter } from "../adapters/Reporter.sol";
import { IAdapter } from "../interfaces/IAdapter.sol";

contract MockReporter is Reporter {
    constructor(address headerStorage, address yaho) Reporter(headerStorage, yaho) {}

    function _dispatch(uint256, address, uint256[] memory, bytes32[] memory) internal override returns (bytes32) {}
}
