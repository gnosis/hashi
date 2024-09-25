// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

/**
 * @title IHashiProver
 */
interface IHashiProver {
    struct AccountProof {
        address account;
        bytes proof;
        bytes blockHeader;
        uint256 chainId;
    }

    struct StorageProof {
        bytes32 storageHash;
        bytes32[] storageKeys;
        bytes[] proofs;
        bytes blockHeader;
        uint256 chainId;
    }

    error InvalidAccount();
    error InvalidBlockHeader();
    error InvalidChainId();
    error InvalidStorageHash();
    error InvalidStorageProofParams();
}
