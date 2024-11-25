// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { HashiProverLib } from "./HashiProverLib.sol";
import { AccountAndStorageProof, ReceiptProof } from "./HashiProverStructs.sol";

contract HashiProverUpgradeable is Initializable, OwnableUpgradeable {
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
        return HashiProverLib.verifyForeignEvent(proof, shoyuBashi);
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
        return HashiProverLib.verifyForeignStorage(proof, shoyuBashi);
    }

    /// @notice This empty reserved space is put in place to allow future versions to add new variables without shifting down storage in the inheritance chain (see [OpenZeppelin's guide about storage gaps](https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps)).
    uint256[49] private __gap;
}
