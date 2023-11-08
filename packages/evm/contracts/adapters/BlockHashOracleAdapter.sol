// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { RLPReader } from "solidity-rlp/contracts/RLPReader.sol";
import { Message } from "../interfaces/IMessage.sol";
import { OracleAdapter } from "./OracleAdapter.sol";

abstract contract BlockHashOracleAdapter is OracleAdapter {
    using RLPReader for RLPReader.RLPItem;

    error InvalidBlockHeaderRLP();
    error InvalidBlockHeaderLength(uint256 length);
    error ConflictingBlockMessageHash(
        uint256 blockNumber,
        bytes32 reportedBlockMessageHash,
        bytes32 storedBlockMessageHash
    );

    /// @dev Proves and stores valid ancestral block hashes for a given chain ID.
    /// @param fromChainId The ID of the chain to prove block hashes for.
    /// @param blockHeaders The RLP encoded block headers to prove the hashes for.
    /// @param yaho Yaho address.
    /// @notice Block headers should be ordered by descending block number and should start with a known block header.
    function proveAncestralBlockHashes(uint256 fromChainId, bytes[] memory blockHeaders, address yaho) external {
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
            bytes32 reportedMessageId = calculateMessageId(
                fromChainId,
                yaho,
                keccak256(abi.encode(blockNumber, MESSAGE_BHR))
            );
            Message memory reportedMessage = Message(
                fromChainId,
                block.chainid,
                address(0),
                address(0),
                abi.encode(blockNumber, reportedBlockHash)
            );

            bytes32 reportedBlockMessageHash = calculateMessageHash(reportedMessage, reportedMessageId, yaho);
            bytes32 storedBlockMessageHash = hashes[fromChainId][reportedMessageId];

            if (reportedBlockMessageHash != storedBlockMessageHash)
                revert ConflictingBlockMessageHash(blockNumber, reportedBlockMessageHash, storedBlockMessageHash);

            Message memory message = Message(
                fromChainId,
                block.chainid,
                address(0),
                address(0),
                abi.encode(blockNumber - 1, blockParent)
            );

            bytes32 messageId = calculateMessageId(
                fromChainId,
                yaho,
                keccak256(abi.encode(blockNumber - 1, MESSAGE_BHR))
            );
            bytes32 messageHash = calculateMessageHash(message, messageId, yaho);

            _storeHash(fromChainId, messageId, messageHash);
        }
    }
}
