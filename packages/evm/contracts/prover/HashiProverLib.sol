// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

import { SecureMerkleTrie } from "@eth-optimism/contracts-bedrock/src/libraries/trie/SecureMerkleTrie.sol";
import { MerkleTrie } from "@eth-optimism/contracts-bedrock/src/libraries/trie/MerkleTrie.sol";
import { RLPReader } from "@eth-optimism/contracts-bedrock/src/libraries/rlp/RLPReader.sol";
import { AccountAndStorageProof, ReceiptProof } from "./HashiProverStructs.sol";
import { IShoyuBashi } from "../interfaces/IShoyuBashi.sol";

library HashiProverLib {
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for bytes;

    error BlockHeaderNotFound();
    error ConflictingBlockHeader(uint256 blockNumber, bytes32 ancestralBlockHeaderHash, bytes32 blockHeaderHash);
    error InvalidAccount();
    error InvalidLogIndex();
    error InvalidReceipt();
    error InvalidStorageHash();
    error InvalidStorageProofParams();
    error UnsupportedTxType();

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
     * @param shoyuBashi The address of ShoyuBashi contract
     *
     * @return bytes The RLP-encoded event corresponding to the specified `logIndex`.
     */
    function verifyForeignEvent(ReceiptProof calldata proof, address shoyuBashi) internal view returns (bytes memory) {
        bytes memory blockHeader = checkBlockHeaderAgainstHashi(
            proof.chainId,
            proof.blockNumber,
            proof.blockHeader,
            proof.ancestralBlockNumber,
            proof.ancestralBlockHeaders,
            shoyuBashi
        );
        RLPReader.RLPItem[] memory blockHeaderFields = blockHeader.toRLPItem().readList();
        bytes32 receiptsRoot = bytes32(blockHeaderFields[5].readBytes());

        bytes memory value = MerkleTrie.get(proof.transactionIndex, proof.receiptProof, receiptsRoot);
        RLPReader.RLPItem[] memory receiptFields = extractReceiptFields(value);
        if (receiptFields.length != 4) revert InvalidReceipt();

        RLPReader.RLPItem[] memory logs = receiptFields[3].readList();
        if (proof.logIndex >= logs.length) revert InvalidLogIndex();
        return logs[proof.logIndex].readRawBytes();
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
     * @param shoyuBashi The address of ShoyuBashi contract
     *
     * @return bytes[] An array of storage values corresponding to the specified `storageKeys`.
     */
    function verifyForeignStorage(
        AccountAndStorageProof calldata proof,
        address shoyuBashi
    ) internal view returns (bytes[] memory) {
        bytes memory blockHeader = checkBlockHeaderAgainstHashi(
            proof.chainId,
            proof.blockNumber,
            proof.blockHeader,
            proof.ancestralBlockNumber,
            proof.ancestralBlockHeaders,
            shoyuBashi
        );
        RLPReader.RLPItem[] memory blockHeaderFields = blockHeader.toRLPItem().readList();
        bytes32 stateRoot = bytes32(blockHeaderFields[3].readBytes());
        (, , bytes32 storageHash, ) = verifyAccountProof(proof.account, stateRoot, proof.accountProof);
        return verifyStorageProof(storageHash, proof.storageKeys, proof.storageProof);
    }

    /**
     * @notice Verifies a block header against the Hashi contract by checking its hash and, if needed, traversing ancestral blocks.
     * @dev This function first checks if the provided block header hash matches the threshold hash stored in the ShoyuBashi contract.
     * If it doesn't match directly, it will verify the block by traversing ancestral blocks until a matching block header or ancestor is found.
     * If no match is found, it reverts with `BlockHeaderNotFound`.
     * @param chainId The chain ID associated with the block.
     * @param blockNumber The number of the block to be checked.
     * @param blockHeader The RLP-encoded header of the block.
     * @param ancestralBlockNumber The block number of the ancestral block to be verified, if applicable.
     * @param ancestralBlockHeaders An array of RLP-encoded headers for ancestral blocks.
     * @param shoyuBashi The address of ShoyuBashi contract.
     * @return bytes The RLP-encoded block header if successfully verified.
     */
    function checkBlockHeaderAgainstHashi(
        uint256 chainId,
        uint256 blockNumber,
        bytes memory blockHeader,
        uint256 ancestralBlockNumber,
        bytes[] memory ancestralBlockHeaders,
        address shoyuBashi
    ) internal view returns (bytes memory) {
        bytes32 blockHeaderHash = keccak256(blockHeader);
        bytes32 currentBlockHeaderHash = IShoyuBashi(shoyuBashi).getThresholdHash(chainId, blockNumber);
        if (currentBlockHeaderHash == blockHeaderHash && ancestralBlockHeaders.length == 0) return blockHeader;

        for (uint256 i = 0; i < ancestralBlockHeaders.length; i++) {
            RLPReader.RLPItem[] memory ancestralBlockHeaderFields = ancestralBlockHeaders[i].readList();

            bytes32 blockParentHash = bytes32(ancestralBlockHeaderFields[0].readBytes());
            uint256 currentAncestralBlockNumber = bytesToUint(ancestralBlockHeaderFields[8].readBytes());

            bytes32 ancestralBlockHeaderHash = keccak256(ancestralBlockHeaders[i]);
            if (ancestralBlockHeaderHash != currentBlockHeaderHash)
                revert ConflictingBlockHeader(
                    currentAncestralBlockNumber,
                    ancestralBlockHeaderHash,
                    currentBlockHeaderHash
                );

            if (ancestralBlockNumber == currentAncestralBlockNumber) {
                return ancestralBlockHeaders[i];
            } else {
                currentBlockHeaderHash = blockParentHash;
            }
        }

        revert BlockHeaderNotFound();
    }

    /**
     * @notice Extracts the fields of a transaction receipt from its RLP-encoded data.
     * @dev This function handles different transaction types by setting the appropriate offset for RLP parsing.
     * It adjusts the starting point based on the transaction type byte, then uses RLPReader to parse the fields.
     * @param value The RLP-encoded transaction receipt.
     * @return RLPReader.RLPItem[] An array of RLP items representing the fields of the receipt.
     */
    function extractReceiptFields(bytes memory value) internal pure returns (RLPReader.RLPItem[] memory) {
        bytes1 txTypeOrFirstByte = value[0];

        uint256 offset;
        if (
            txTypeOrFirstByte == 0x01 ||
            txTypeOrFirstByte == 0x02 ||
            txTypeOrFirstByte == 0x03 ||
            txTypeOrFirstByte == 0x7e // EIP-2718 (https://eips.ethereum.org/EIPS/eip-2718) transaction
        ) {
            offset = 1;
        } else if (txTypeOrFirstByte >= 0xc0) {
            offset = 0;
        } else {
            revert UnsupportedTxType();
        }

        uint256 ptr;
        assembly {
            ptr := add(value, 32)
        }

        return
            RLPReader
                .RLPItem({ length: value.length - offset, ptr: RLPReader.MemoryPointer.wrap(ptr + offset) })
                .readList();
    }

    /**
     * @notice Verifies an account proof and extracts account fields from it.
     * @dev This function uses a Merkle proof to verify the account state in a given state root.
     * It retrieves and decodes the account data, checking the storage root and account structure.
     * @param account The address of the account to verify.
     * @param stateRoot The state root against which the account proof is verified.
     * @param proof A Merkle proof required to verify the account.
     * @return uint256 The nonce of the account.
     * @return uint256 The balance of the account.
     * @return bytes32 The storage root of the account.
     * @return bytes32 The code hash of the account.
     */
    function verifyAccountProof(
        address account,
        bytes32 stateRoot,
        bytes[] memory proof
    ) internal pure returns (uint256, uint256, bytes32, bytes32) {
        bytes memory accountRlp = SecureMerkleTrie.get(abi.encodePacked(account), proof, stateRoot);

        bytes32 accountStorageRoot = bytes32(accountRlp.toRLPItem().readList()[2].readBytes());
        if (accountStorageRoot.length == 0) revert InvalidStorageHash();
        RLPReader.RLPItem[] memory accountFields = accountRlp.toRLPItem().readList();
        if (accountFields.length != 4) revert InvalidAccount();
        // [nonce, balance, storageHash, codeHash]
        return (
            bytesToUint(accountFields[0].readBytes()),
            bytesToUint(accountFields[1].readBytes()),
            bytes32(accountFields[2].readBytes()),
            bytes32(accountFields[3].readBytes())
        );
    }

    /**
     * @notice Verifies multiple storage proofs and retrieves the storage values associated with given keys.
     * @dev This function iterates over provided storage keys and their respective proofs,
     * using a Merkle proof to verify each storage value against the specified storage hash.
     * @param storageHash The root hash of the storage trie for the account being verified.
     * @param storageKeys An array of storage keys for which values need to be verified.
     * @param proof A 2D array of Merkle proof elements for each storage key.
     * @return bytes[] An array of storage values corresponding to each storage key.
     */
    function verifyStorageProof(
        bytes32 storageHash,
        bytes32[] memory storageKeys,
        bytes[][] memory proof
    ) internal pure returns (bytes[] memory) {
        bytes[] memory results = new bytes[](proof.length);
        if (storageKeys.length == 0 || proof.length == 0 || storageKeys.length != proof.length)
            revert InvalidStorageProofParams();
        for (uint256 i = 0; i < proof.length; ) {
            RLPReader.RLPItem memory item = RLPReader.toRLPItem(
                SecureMerkleTrie.get(abi.encode(storageKeys[i]), proof[i], storageHash)
            );
            results[i] = item.readBytes();
            unchecked {
                ++i;
            }
        }
        return results;
    }

    /**
     * @notice Converts a byte array to an unsigned integer (uint256).
     * @param b The byte array to convert to an unsigned integer.
     * @return uint256 The resulting unsigned integer from the byte array.
     */
    function bytesToUint(bytes memory b) internal pure returns (uint256) {
        uint256 number;
        for (uint256 i = 0; i < b.length; i++) {
            number = number + uint256(uint8(b[i])) * (2 ** (8 * (b.length - (i + 1))));
        }
        return number;
    }
}
