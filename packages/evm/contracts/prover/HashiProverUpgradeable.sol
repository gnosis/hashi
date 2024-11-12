// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { SecureMerkleTrie } from "@eth-optimism/contracts-bedrock/src/libraries/trie/SecureMerkleTrie.sol";
import { MerkleTrie } from "@eth-optimism/contracts-bedrock/src/libraries/trie/MerkleTrie.sol";
import { RLPReader } from "solidity-rlp/contracts/RLPReader.sol";
import { IHashiProver } from "../interfaces/IHashiProver.sol";
import { IShoyuBashi } from "../interfaces/IShoyuBashi.sol";

contract HashiProverUpgradeable is IHashiProver, Initializable, OwnableUpgradeable {
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for bytes;

    /// @notice Stores the address of the ShoyuBashi contract.
    /// @dev This address can be updated by the owner using the `setShoyuBashi` function.
    address public shoyuBashi;

    /**
     * @notice Emitted when the ShoyuBashi contract address is updated.
     * @param shoyuBashi The new address of the ShoyuBashi contract.
     */
    event ShoyuBashiSet(address shoyuBashi);

    function __HashiProverUpgradeable_init(address shoyuBashi_) public onlyInitializing {
        __Ownable_init();
        shoyuBashi = shoyuBashi_;
    }

    /**
     * @notice Sets the address of the ShoyuBashi contract.
     * @dev This function can only be called by the contract owner.
     * It updates the `shoyuBashi` address and emits an event to record the change.
     * @param shoyuBashi_ The new address for the ShoyuBashi contract.
     */
    function setShoyuBashi(address shoyuBashi_) external onlyOwner {
        shoyuBashi = shoyuBashi_;
        emit ShoyuBashiSet(shoyuBashi_);
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
        bytes memory blockHeader = _checkBlockHeaderAgainstHashi(
            proof.chainId,
            proof.blockNumber,
            proof.blockHeader,
            proof.ancestralBlockNumber,
            proof.ancestralBlockHeaders
        );
        RLPReader.RLPItem[] memory blockHeaderFields = blockHeader.toRlpItem().toList();
        bytes32 receiptsRoot = bytes32(blockHeaderFields[5].toUint());

        bytes memory value = MerkleTrie.get(proof.transactionIndex, proof.receiptProof, receiptsRoot);
        RLPReader.RLPItem[] memory receiptFields = _extractReceiptFields(value);
        if (receiptFields.length != 4) revert InvalidReceipt();

        RLPReader.RLPItem[] memory logs = receiptFields[3].toList();
        if (proof.logIndex >= logs.length) revert InvalidLogIndex();
        return logs[proof.logIndex].toRlpBytes();
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
     * - storageHash: Expected hash of the storage root for the account.
     * - storageKeys: Array of storage keys for which data is being verified.
     * - storageProof: Proof data for locating the storage values in the storage trie.
     *
     * @return bytes[] An array of storage values corresponding to the specified `storageKeys`.
     */
    function verifyForeignStorage(AccountAndStorageProof calldata proof) internal view returns (bytes[] memory) {
        bytes memory blockHeader = _checkBlockHeaderAgainstHashi(
            proof.chainId,
            proof.blockNumber,
            proof.blockHeader,
            proof.ancestralBlockNumber,
            proof.ancestralBlockHeaders
        );
        RLPReader.RLPItem[] memory blockHeaderFields = blockHeader.toRlpItem().toList();
        bytes32 stateRoot = bytes32(blockHeaderFields[3].toUint());
        (, , bytes32 expectedStorageHash, ) = _verifyAccountProof(proof.account, stateRoot, proof.accountProof);
        if (proof.storageHash != expectedStorageHash) revert InvalidStorageHash();
        return _verifyStorageProof(proof.storageHash, proof.storageKeys, proof.storageProof);
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
     * @return bytes The RLP-encoded block header if successfully verified.
     */
    function _checkBlockHeaderAgainstHashi(
        uint256 chainId,
        uint256 blockNumber,
        bytes memory blockHeader,
        uint256 ancestralBlockNumber,
        bytes[] memory ancestralBlockHeaders
    ) private view returns (bytes memory) {
        bytes32 blockHeaderHash = keccak256(blockHeader);
        bytes32 currentBlockHeaderHash = IShoyuBashi(shoyuBashi).getThresholdHash(chainId, blockNumber);
        if (currentBlockHeaderHash == blockHeaderHash && ancestralBlockHeaders.length == 0) return blockHeader;

        for (uint256 i = 0; i < ancestralBlockHeaders.length; i++) {
            RLPReader.RLPItem memory ancestralBlockHeaderRLP = RLPReader.toRlpItem(ancestralBlockHeaders[i]);
            RLPReader.RLPItem[] memory ancestralBlockHeaderContent = ancestralBlockHeaderRLP.toList();

            bytes32 blockParentHash = bytes32(ancestralBlockHeaderContent[0].toUint());
            uint256 currentAncestralBlockNumber = uint256(ancestralBlockHeaderContent[8].toUint());

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
    function _extractReceiptFields(bytes memory value) private pure returns (RLPReader.RLPItem[] memory) {
        uint256 offset;
        if (value[0] == 0x01 || value[0] == 0x02 || value[0] == 0x03 || value[0] == 0x7e) {
            offset = 1;
        } else if (value[0] >= 0xc0) {
            offset = 0;
        } else {
            revert UnsupportedTxType();
        }

        uint256 memPtr;
        assembly {
            memPtr := add(value, add(0x20, mul(0x01, offset)))
        }

        return RLPReader.RLPItem(value.length - offset, memPtr).toList();
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
    function _verifyAccountProof(
        address account,
        bytes32 stateRoot,
        bytes[] memory proof
    ) private pure returns (uint256, uint256, bytes32, bytes32) {
        bytes memory accountRlp = SecureMerkleTrie.get(abi.encodePacked(account), proof, stateRoot);

        bytes32 accountStorageRoot = bytes32(accountRlp.toRlpItem().toList()[2].toUint());
        if (accountStorageRoot.length == 0) revert InvalidStorageHash();
        RLPReader.RLPItem[] memory accountFields = accountRlp.toRlpItem().toList();
        if (accountFields.length != 4) revert InvalidAccount();
        // [nonce, balance, storageHash, codeHash]
        return (
            accountFields[0].toUint(),
            accountFields[1].toUint(),
            bytes32(accountFields[2].toUint()),
            bytes32(accountFields[3].toUint())
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
    function _verifyStorageProof(
        bytes32 storageHash,
        bytes32[] memory storageKeys,
        bytes[][] memory proof
    ) private pure returns (bytes[] memory) {
        bytes[] memory results = new bytes[](proof.length);
        if (storageKeys.length == 0 || proof.length == 0 || storageKeys.length != proof.length)
            revert InvalidStorageProofParams();
        for (uint256 i = 0; i < proof.length; ) {
            RLPReader.RLPItem memory item = RLPReader.toRlpItem(
                SecureMerkleTrie.get(abi.encode(storageKeys[i]), proof[i], storageHash)
            );
            results[i] = item.toBytes();
            unchecked {
                ++i;
            }
        }
        return results;
    }

    /// @notice This empty reserved space is put in place to allow future versions to add new variables without shifting down storage in the inheritance chain (see [OpenZeppelin's guide about storage gaps](https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps)).
    uint256[49] private __gap;
}
