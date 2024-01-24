// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IOracleAdapter } from "./IOracleAdapter.sol";

interface IBlockHashOracleAdapter is IOracleAdapter {
    /**
     * @dev Proves and stores valid ancestral block hashes for a given chain ID.
     * @param chainId - The ID of the chain for which the block hashes are to be proven and stored.
     * @param blockHeaders - The RLP encoded block headers. These headers are used to prove and subsequently store the hashes.
     * @notice The block headers should be ordered by descending block number. The sequence should start with a block header that is already known and verified.
     */
    function proveAncestralBlockHashes(uint256 chainId, bytes[] memory blockHeaders) external;
}
