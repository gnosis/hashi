// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

/**
 * @notice Represents a proof structure for verifying both account and storage data within a specific blockchain state.
 * @dev This struct includes all necessary components to verify account existence and storage values in a specified block.
 */
struct AccountAndStorageProof {
    uint256 chainId; // The ID of the blockchain where the proof is applicable.
    uint256 blockNumber; // The block number at which the proof is generated.
    bytes blockHeader; // The RLP-encoded header of the block containing the account state.
    uint256 ancestralBlockNumber; // The block number of an ancestral block if needed for verification.
    bytes[] ancestralBlockHeaders; // An array of RLP-encoded headers for ancestral blocks (used if the proof requires it).
    address account; // The address of the account being proven.
    bytes[] accountProof; // Merkle proof for verifying the account's state in the specified block.
    bytes32[] storageKeys; // An array of storage keys for which values are being proven.
    bytes[][] storageProof; // A 2D array of Merkle proofs for each storage key, verifying each key-value pair in the storage trie.
}

struct ReceiptProof {
    uint256 chainId;
    uint256 blockNumber;
    bytes blockHeader;
    uint256 ancestralBlockNumber;
    bytes[] ancestralBlockHeaders;
    bytes[] receiptProof;
    bytes transactionIndex;
    uint256 logIndex;
}
