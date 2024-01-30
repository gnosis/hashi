// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

/**
 * @title IHeaderStorage
 */
interface IHeaderStorage {
    error HeaderOutOfRange(uint256 blockNumber);

    event HeaderStored(uint256 indexed blockNumber, bytes32 indexed blockHeader);

    /**
     * @dev Retrieves the stored block header for a specific block number.
     * @param blockNumber - The block number as a uint256 value.
     * @return The block header as a bytes32 value.
     */
    function headers(uint256 blockNumber) external view returns (bytes32);

    /**
     * @dev Stores and returns the header for the given block.
     * @param blockNumber - Block number.
     * @return blockHeader - Block header stored.
     * @notice Reverts if the given block header was not previously stored and is now out of range.
     */
    function storeBlockHeader(uint256 blockNumber) external returns (bytes32);

    /**
     * @dev Stores and returns the header for an array of given blocks.
     * @param blockNumbers - Array of block numbers.
     * @return blockHeaders - Array of block headers stored.
     * @notice Reverts if the given block header was not previously stored and is now out of range.
     */
    function storeBlockHeaders(uint256[] memory blockNumbers) external returns (bytes32[] memory);
}
