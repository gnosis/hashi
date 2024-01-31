// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

/**
 * @title IAdapter
 */
interface IAdapter {
    error InvalidBlockHeaderLength(uint256 length);
    error InvalidBlockHeaderRLP();
    error ConflictingBlockHeader(uint256 blockNumber, bytes32 blockHash, bytes32 storedBlockHash);

    /**
     * @dev Emitted when a hash is stored.
     * @param id - The ID of the stored hash.
     * @param hash - The stored hash as bytes32 values.
     */
    event HashStored(uint256 indexed id, bytes32 indexed hash);

    /**
     * @dev Returns the hash for a given ID.
     * @param domain - Identifier for the domain to query.
     * @param id - Identifier for the ID to query.
     * @return hash Bytes32 hash for the given ID on the given domain.
     * @notice MUST return bytes32(0) if the hash is not present.
     */
    function getHash(uint256 domain, uint256 id) external view returns (bytes32 hash);
}
