// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { RLPReader } from "solidity-rlp/contracts/RLPReader.sol";

import { OracleAdapter } from "./OracleAdapter.sol";

abstract contract BlockHashOracleAdapter is OracleAdapter {
    using RLPReader for RLPReader.RLPItem;

    /// @dev Proves and stores valid ancestral block hashes for a given chain ID.
    /// @param chainId The ID of the chain to prove block hashes for.
    /// @param blockHeaders The RLP encoded block headers to prove the hashes for.
    /// @notice Block headers should be ordered by descending block number and should start with a known block header.
    function proveAncestralBlockHashes(uint256 chainId, bytes[] memory blockHeaders) external {
        for (uint256 i = 0; i < blockHeaders.length; i++) {
            RLPReader.RLPItem memory blockHeaderRLP = RLPReader.toRlpItem(blockHeaders[i]);

            if (!blockHeaderRLP.isList()) revert InvalidBlockHeaderRLP();

            RLPReader.RLPItem[] memory blockHeaderContent = blockHeaderRLP.toList();

            // A block header should have between 15 and 17 elements (baseFee and withdrawalsRoot have been added later)
            if (blockHeaderContent.length < 15 || blockHeaderContent.length > 17)
                revert InvalidBlockHeaderLength(blockHeaderContent.length);

            bytes32 blockParent = bytes32(blockHeaderContent[0].toUint());
            uint256 blockNumber = uint256(blockHeaderContent[8].toUint());

            bytes32 reportedBlockHash = keccak256(blockHeaders[i]);
            bytes32 storedBlockHash = hashes[chainId][blockNumber];

            if (reportedBlockHash != storedBlockHash)
                revert ConflictingBlockHeader(blockNumber, reportedBlockHash, storedBlockHash);

            _storeHash(chainId, blockNumber - 1, blockParent);
        }
    }
}
