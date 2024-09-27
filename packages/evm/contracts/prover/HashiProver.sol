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
        AccountAndStorageProof calldata proof
    ) internal view returns (bytes[] memory) {
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

    function _checkBlockHeaderAgainstHashi(
        uint256 chainId,
        uint256 blockNumber,
        bytes memory blockHeader,
        uint256 ancestralBlockNumber,
        bytes[] memory ancestralBlockHeaders
    ) private view returns (bytes memory) {
        bytes32 blockHeaderHash = keccak256(blockHeader);
        bytes32 currentBlockHeaderHash = IShoyuBashi(SHOYU_BASHI).getThresholdHash(chainId, blockNumber);
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

            if (ancestralBlockNumber == currentAncestralBlockNumber && i == ancestralBlockHeaders.length - 1) {
                return ancestralBlockHeaders[i];
            } else if (i == ancestralBlockHeaders.length - 1) {
                revert AncestralBlockHeadersLengthReached();
            } else {
                currentBlockHeaderHash = blockParentHash;
            }
        }

        // NOTE: this point is never reached
        return abi.encodePacked(bytes32(0));
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

    function _verifyStorageProof(
        bytes32 storageHash,
        bytes32[] memory storageKeys,
        bytes[] memory proof
    ) private pure returns (bytes[] memory) {
        bytes[] memory results = new bytes[](proof.length);
        if (storageKeys.length == 0 || proof.length == 0 || storageKeys.length != proof.length)
            revert InvalidStorageProofParams();
        for (uint256 i = 0; i < proof.length; ) {
            results[i] = MerklePatriciaProofVerifier.extractProofValue(
                storageHash,
                abi.encodePacked(keccak256(abi.encode(storageKeys[i]))),
                proof[i].toRlpItem().toList()
            );
            unchecked {
                ++i;
            }
        }
        return results;
    }
}
