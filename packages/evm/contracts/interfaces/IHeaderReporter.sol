// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

interface IHeaderReporter {
    /// @dev Reports the given block hash to a different chain according to the reporter configuration.
    /// @param blockNumbers Block numbers to report hashes for.
    /// @param adapter Adapter contract address to report hashes for.
    function reportHeaders(uint256[] memory blockNumbers, address adapter) external payable;
}
