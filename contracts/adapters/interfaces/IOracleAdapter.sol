// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

interface IOracleAdapter {
    /// @dev Returns the block header for a given block on a given chain.
    /// @param domain Identifier for the domain to query.
    /// @param id Identifier for which to return a hash.
    /// @return hash Hash reported by the oracle for the given ID in the given domain.
    /// @notice MUST return bytes32(0) if the oracle has not yet reported a header for the given block.
    function getHashFromOracle(uint256 domain, uint256 id) external view returns (bytes32 hash);
}
