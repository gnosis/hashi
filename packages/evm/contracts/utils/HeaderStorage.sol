// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

contract HeaderStorage {
    mapping(uint256 => bytes32) public headers;

    event HeaderStored(uint256 indexed blockNumber, bytes32 indexed blockHeader);

    error HeaderOutOfRange(address emitter, uint256 blockNumber);

    /// @dev Stores and returns the header for the given block.
    /// @param blockNumber Block number.
    /// @return blockHeader Block header stored.
    /// @notice Reverts if the given block header was not previously stored and is now out of range.
    function storeBlockHeader(uint256 blockNumber) public returns (bytes32 blockHeader) {
        blockHeader = headers[blockNumber];
        if (blockHeader == 0) {
            blockHeader = blockhash(blockNumber);
            if (blockHeader == 0) revert HeaderOutOfRange(address(this), blockNumber);
            headers[blockNumber] = blockHeader;
            emit HeaderStored(blockNumber, blockHeader);
        }
    }

    /// @dev Stores and returns the header for an array of given blocks.
    /// @param blockNumbers Array of block numbers.
    /// @return Array of block headers.
    /// @notice Reverts if the given block header was not previously stored and is now out of range.
    function storeBlockHeaders(uint256[] memory blockNumbers) public returns (bytes32[] memory) {
        bytes32[] memory blockHeaders = new bytes32[](blockNumbers.length);
        for (uint256 i = 0; i < blockNumbers.length; i++) {
            blockHeaders[i] = storeBlockHeader(blockNumbers[i]);
        }
        return blockHeaders;
    }
}
