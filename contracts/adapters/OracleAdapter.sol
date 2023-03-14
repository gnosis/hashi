// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "./IOracleAdapter.sol";

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract OracleAdapter is IOracleAdapter {
    mapping(uint256 => mapping(uint256 => bytes32)) public headers;

    /// @dev Returns the block header for a given block, as reported by the AMB.
    /// @param chainId Identifier for the chain to query.
    /// @param blockNumber Identifier for the block to query.
    /// @return blockHeader Bytes32 block header reported by the oracle for the given block on the given chain.
    /// @notice MUST return bytes32(0) if the oracle has not yet reported a header for the given block.
    function getHeaderFromOracle(uint256 chainId, uint256 blockNumber) external view returns (bytes32 blockHeader) {
        blockHeader = headers[chainId][blockNumber];
    }

    function proveUnreportedHeader(
        uint256 chainId,
        uint256 rootBlockNumber,
        bytes32 leafBlockHeader,
        bytes32[] memory proof
    ) external view returns (bool) {
        bytes32 rootBlockHeader = headers[chainId][rootBlockNumber];
        return MerkleProof.verify(proof, rootBlockHeader, leafBlockHeader);
    }
}
