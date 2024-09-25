// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { RLPReader } from "solidity-rlp/contracts/RLPReader.sol";
import { MerklePatriciaProofVerifier } from "../libraries/MerklePatriciaProofVerifier.sol";
import { IHashiProver } from "../interfaces/IHashiProver.sol";
import { IShoyuBashi } from "../interfaces/IShoyuBashi.sol";

contract HashiProver is IHashiProver {
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for bytes;

    address public immutable SHOYU_BASHI;

    constructor(address shoyuBashi) {
        SHOYU_BASHI = shoyuBashi;
    }

    function _verifyAccountAndStorageProof(
        AccountProof calldata accountProof,
        StorageProof calldata storageProof
    ) internal view returns (bytes[] memory) {
        bytes32 blockHeaderHash = keccak256(accountProof.blockHeader);
        if (blockHeaderHash != keccak256(storageProof.blockHeader)) revert InvalidBlockHeader();
        if (accountProof.chainId != storageProof.chainId) revert InvalidChainId();
        RLPReader.RLPItem[] memory blockHeaderFields = accountProof.blockHeader.toRlpItem().toList();
        _checkBlockHeaderAgainstHashi(accountProof.chainId, blockHeaderFields[8].toUint(), blockHeaderHash);
        bytes32 stateRoot = bytes32(blockHeaderFields[3].toUint());
        (, , bytes32 expectedStorageHash, ) = _verifyAccountProof(accountProof.account, stateRoot, accountProof.proof);
        if (storageProof.storageHash != expectedStorageHash) revert InvalidStorageHash();
        return _verifyStorageProofs(storageProof.storageHash, storageProof.storageKeys, storageProof.proofs);
    }

    function _verifyStorageProofs(StorageProof calldata storageProof) external view returns (bytes[] memory) {
        RLPReader.RLPItem[] memory blockHeaderFields = storageProof.blockHeader.toRlpItem().toList();
        _checkBlockHeaderAgainstHashi(
            storageProof.chainId,
            blockHeaderFields[8].toUint(),
            keccak256(storageProof.blockHeader)
        );
        return _verifyStorageProofs(storageProof.storageHash, storageProof.storageKeys, storageProof.proofs);
    }

    function _checkBlockHeaderAgainstHashi(uint256 chainId, uint256 blockNumber, bytes32 blockHeaderHash) private view {
        bytes32 expectedBlockHeaderHash = IShoyuBashi(SHOYU_BASHI).getThresholdHash(chainId, blockNumber);
        if (expectedBlockHeaderHash != blockHeaderHash) revert InvalidBlockHeader();
    }

    function _verifyAccountProof(
        address account,
        bytes32 stateRoot,
        bytes memory proof
    ) private pure returns (uint256, uint256, bytes32, bytes32) {
        bytes memory accountRlp = MerklePatriciaProofVerifier.extractProofValue(
            stateRoot,
            abi.encodePacked(keccak256(abi.encodePacked(account))),
            proof.toRlpItem().toList()
        );
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

    function _verifyStorageProofs(
        bytes32 storageHash,
        bytes32[] memory storageKeys,
        bytes[] memory proofs
    ) private pure returns (bytes[] memory) {
        bytes[] memory results = new bytes[](proofs.length);
        if (storageKeys.length == 0 || proofs.length == 0 || storageKeys.length != proofs.length)
            revert InvalidStorageProofParams();
        for (uint256 i = 0; i < proofs.length; ) {
            results[i] = MerklePatriciaProofVerifier.extractProofValue(
                storageHash,
                abi.encodePacked(keccak256(abi.encode(storageKeys[i]))),
                proofs[i].toRlpItem().toList()
            );
            unchecked {
                ++i;
            }
        }
        return results;
    }
}
