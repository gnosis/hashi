// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

interface IOracleAdapter {
    /// @dev Returns the block header for a given block on a given chain.
    /// @param chainId Identifier for the chain to query.
    /// @param blockNumber Identifier for the block to query.
    /// @return blockHeader Block header reported by the oracle for the given block on the given chain.
    /// @notice MUST return bytes32(0) if the oracle has not yet reported a header for the given block.
    function getHeaderFromOracle(uint256 chainId, uint256 blockNumber) external view returns (bytes32 blockHeader);

    event HeaderStored(uint256 indexed blockNumber, bytes32 indexed blockHeader);
}
