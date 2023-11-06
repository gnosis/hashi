// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { RLPReader } from "solidity-rlp/contracts/RLPReader.sol";
import { MessageIdCalculator } from "../utils/MessageIdCalculator.sol";
import { OracleAdapter } from "./OracleAdapter.sol";

abstract contract BlockHashOracleAdapter is OracleAdapter, MessageIdCalculator {
    using RLPReader for RLPReader.RLPItem;

    bytes32 public immutable MESSAGE_BHR = keccak256("MESSAGE_BHR");

    /// @dev Proves and stores valid ancestral block hashes for a given chain ID.
    /// @param chainId The ID of the chain to prove block hashes for.
    /// @param blockHeaders The RLP encoded block headers to prove the hashes for.
    /// @param yaho The address of Yaho.
    /// @notice Block headers should be ordered by descending block number and should start with a known block header.
    function proveAncestralBlockHashes(uint256 chainId, bytes[] memory blockHeaders, address yaho) external {
        uint256[] memory blockNumbers = new uint256[](blockHeaders.length);
        bytes32[] memory blockParents = new bytes32[](blockHeaders.length);

        for (uint256 i = 0; i < blockHeaders.length; i++) {
            RLPReader.RLPItem memory blockHeaderRLP = RLPReader.toRlpItem(blockHeaders[i]);

            if (!blockHeaderRLP.isList()) revert InvalidBlockHeaderRLP();

            RLPReader.RLPItem[] memory blockHeaderContent = blockHeaderRLP.toList();

            // A block header should have between 15 and 17 elements (baseFee and withdrawalsRoot have been added later)
            if (blockHeaderContent.length < 15 || blockHeaderContent.length > 17)
                revert InvalidBlockHeaderLength(blockHeaderContent.length);

            blockParents[i] = bytes32(blockHeaderContent[0].toUint());
            uint256 blockNumber = uint256(blockHeaderContent[8].toUint());

            bytes32 reportedBlockHash = keccak256(blockHeaders[i]);
            bytes32 storedBlockHash = hashes[chainId][bytes32(blockNumber)];

            if (reportedBlockHash != storedBlockHash)
                revert ConflictingBlockHeader(blockNumber, reportedBlockHash, storedBlockHash);

            blockNumbers[i] = blockNumber - 1;
        }

        bytes32 messageHash = keccak256(abi.encode(blockNumbers, blockParents));
        bytes32 messageId = calculateMessageId(chainId, yaho, MESSAGE_BHR, bytes32(0), messageHash);
        _storeHash(chainId, messageId, messageHash);
    }
}
