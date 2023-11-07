// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

interface IOracleAdapter {
    event HashStored(bytes32 indexed id, bytes32 indexed hashes);

    /// @dev Returns the hash for a given ID, as reported by the oracle.
    /// @param domain Identifier for the domain to query.
    /// @param id Identifier for the ID to query.
    /// @return hash Bytes32 hash reported by the oracle for the given ID on the given domain.
    /// @notice MUST return bytes32(0) if the oracle has not yet reported a hash for the given ID.
    function getHashFromOracle(uint256 domain, bytes32 id) external view returns (bytes32 hash);
}
