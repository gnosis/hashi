// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { RLPReader } from "solidity-rlp/contracts/RLPReader.sol";
import { Adapter } from "./Adapter.sol";
import { IBlockHashAdapter } from "../interfaces/IBlockHashAdapter.sol";

abstract contract BlockHashAdapter is IBlockHashAdapter, Adapter {
    using RLPReader for RLPReader.RLPItem;

    /// @inheritdoc IBlockHashAdapter
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

            bytes32 blockHash = keccak256(blockHeaders[i]);
            bytes32 storedBlockHash = getHash(chainId, blockNumber);

            if (blockHash != storedBlockHash) revert ConflictingBlockHeader(blockNumber, blockHash, storedBlockHash);

            _storeHash(chainId, blockNumber - 1, blockParent);
        }
    }
}
