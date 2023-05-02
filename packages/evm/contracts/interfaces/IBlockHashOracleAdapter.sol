// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IOracleAdapter } from "./IOracleAdapter.sol";

interface IBlockHashOracleAdapter is IOracleAdapter {
    /// @dev Proves and stores valid ancestral block hashes for a given chain ID.
    /// @param chainId The ID of the chain to prove block hashes for.
    /// @param blockHeaders The RLP encoded block headers to prove the hashes for.
    /// @notice Block headers should be ordered by descending block number and should start with a known block header.
    function proveAncestralBlockHashes(uint256 chainId, bytes[] memory blockHeaders) external;
}
