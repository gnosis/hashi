// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

/**
 * @title IHashiProver
 */
interface IHashiProver {
    struct AccountAndStorageProof {
        uint256 chainId;
        uint256 blockNumber;
        bytes blockHeader;
        uint256 ancestralBlockNumber;
        bytes[] ancestralBlockHeaders;
        address account;
        bytes accountProof;
        bytes32 storageHash;
        bytes32[] storageKeys;
        bytes[] storageProof;
    }

    error AncestralBlockHeadersLengthReached();
    error ConflictingBlockHeader(uint256 blockNumber, bytes32 ancestralBlockHeaderHash, bytes32 blockHeaderHash);
    error InvalidAccount();
    error InvalidBlockHeader();
    error InvalidBlockHeaderLength();
    error InvalidStorageHash();
    error InvalidStorageProofParams();
}
