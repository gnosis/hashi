// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

interface IHeaderReporter {
    /// @dev Reports the given block hash to a different chain according to the reporter configuration.
    /// @param blockNumber Block number to report hash for.
    function reportHeader(uint256 blockNumber) external payable;
}
