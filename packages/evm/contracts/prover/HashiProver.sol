// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

import { HashiProverLib } from "./HashiProverLib.sol";
import { AccountAndStorageProof, ReceiptProof } from "./HashiProverStructs.sol";

contract HashiProver {
    /// @notice Stores the address of the ShoyuBashi contract.
    address public immutable SHOYU_BASHI;

    constructor(address shoyuBashi) {
        SHOYU_BASHI = shoyuBashi;
    }

    /**
     * @dev Verifies and retrieves a specific event from a transaction receipt in a foreign blockchain.
     *
     * @param proof A `ReceiptProof` struct containing proof details:
     * - chainId: The chain ID of the foreign blockchain.
     * - blockNumber: If ancestralBlockNumber is 0, then blockNumber represents the block where the transaction occurred and is available in Hashi.
     * - blockHeader: The header of the specified block.
     * - ancestralBlockNumber: If provided, this is the block number where the transaction took place. In this case, blockNumber is the block whose header is accessible in Hashi.
     * - ancestralBlockHeaders: Array of block headers to prove the ancestry of the specified block.
     * - receiptProof: Proof data for locating the receipt in the Merkle Trie.
     * - transactionIndex: Index of the transaction within the block.
     * - logIndex: The specific log index within the transaction receipt.
     *
     * @return bytes The RLP-encoded event corresponding to the specified `logIndex`.
     */
    function verifyForeignEvent(ReceiptProof calldata proof) internal view returns (bytes memory) {
        return HashiProverLib.verifyForeignEvent(proof, SHOYU_BASHI);
    }

    /**
     * @dev Verifies foreign storage data for a specified account on a foreign blockchain.
     *
     * @param proof An `AccountAndStorageProof` struct containing proof details:
     * - chainId: The chain ID of the foreign blockchain.
     * - blockNumber: If ancestralBlockNumber is 0, then blockNumber represents the block where the transaction occurred and is available in Hashi.
     * - blockHeader: The header of the specified block.
     * - ancestralBlockNumber: If provided, this is the block number where the transaction took place. In this case, blockNumber is the block whose header is accessible in Hashi.
     * - ancestralBlockHeaders: Array of block headers proving ancestry of the specified block.
     * - account: The account address whose storage is being verified.
     * - accountProof: Proof data for locating the account in the state trie.
     * - storageKeys: Array of storage keys for which data is being verified.
     * - storageProof: Proof data for locating the storage values in the storage trie.
     *
     * @return bytes[] An array of storage values corresponding to the specified `storageKeys`.
     */
    function verifyForeignStorage(AccountAndStorageProof calldata proof) internal view returns (bytes[] memory) {
        return HashiProverLib.verifyForeignStorage(proof, SHOYU_BASHI);
    }
}
