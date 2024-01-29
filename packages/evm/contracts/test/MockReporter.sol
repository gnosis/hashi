// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Reporter } from "../adapters/Reporter.sol";
import { IOracleAdapter } from "../interfaces/IOracleAdapter.sol";

contract MockReporter is Reporter {
    constructor(address headerStorage, address yaho) Reporter(headerStorage, yaho) {}

    function _dispatch(uint256, address, uint256[] memory, bytes32[] memory) internal override returns (bytes32) {}
}
