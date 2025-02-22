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

/**
 * @notice Represents a proof structure for verifying a transaction receipt and its corresponding log entry within a specific block.
 * @dev This struct includes all necessary components to verify the validity of a transaction receipt and the log it produced in a specified block.
 */
struct ReceiptProof {
    uint256 chainId; // The ID of the blockchain where the proof is applicable.
    uint256 blockNumber; // The block number at which the transaction receipt is included.
    bytes blockHeader; // The RLP-encoded header of the block containing the transaction receipt.
    uint256 ancestralBlockNumber; // The block number of an ancestral block, if needed for receipt verification.
    bytes[] ancestralBlockHeaders; // An array of RLP-encoded headers for ancestral blocks (used if the proof requires them).
    bytes[] receiptProof; // Merkle proof for verifying the transaction receipt in the block's receipt trie.
    bytes transactionIndex; // The index of the transaction within the block's transaction list (RLP-encoded).
    uint256 logIndex; // The index of the log entry within the transaction receipt being proven.
}

struct SolanaAccountProof {
    uint256 chainId; // The ID of the blockchain where the proof is applicable.
    uint256 nonce; // A unique identifier used to locate the specific Merkle root in Hashi for which the proof verification is performed.
    bytes account; // The Solana account data with this format: pubkey, lamports, data, owner, rent_epoch
    bytes[][] accountProof; // Merkle proof to verify the accunt within the merkle root stored in Hashi
}
