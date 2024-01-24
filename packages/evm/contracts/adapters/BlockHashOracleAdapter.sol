// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { RLPReader } from "solidity-rlp/contracts/RLPReader.sol";
import { OracleAdapter } from "./OracleAdapter.sol";
import { IBlockHashOracleAdapter } from "../interfaces/IBlockHashOracleAdapter.sol";

abstract contract BlockHashOracleAdapter is IBlockHashOracleAdapter, OracleAdapter {
    using RLPReader for RLPReader.RLPItem;

    /// @inheritdoc IBlockHashOracleAdapter
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
            bytes32 storedBlockHash = getHashFromOracle(chainId, blockNumber);

            if (reportedBlockHash != storedBlockHash)
                revert ConflictingBlockHeader(blockNumber, reportedBlockHash, storedBlockHash);

            _storeHash(chainId, blockNumber - 1, blockParent);
        }
    }
}
