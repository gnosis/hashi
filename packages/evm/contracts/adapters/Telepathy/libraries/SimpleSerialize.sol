// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

library SSZ {
    // G-indicies for the BeaconBlockHeader -> bodyRoot -> executionPayload -> {blockNumber, blockHash}
    uint256 internal constant EXECUTION_PAYLOAD_BLOCK_NUMBER_INDEX = 3222;
    uint256 internal constant EXECUTION_PAYLOAD_BLOCK_HASH_INDEX = 3228;

    function toLittleEndian(uint256 _v) internal pure returns (bytes32) {
        _v =
            ((_v & 0xFF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00) >> 8) |
            ((_v & 0x00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF) << 8);
        _v =
            ((_v & 0xFFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000) >> 16) |
            ((_v & 0x0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF) << 16);
        _v =
            ((_v & 0xFFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000) >> 32) |
            ((_v & 0x00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF) << 32);
        _v =
            ((_v & 0xFFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF0000000000000000) >> 64) |
            ((_v & 0x0000000000000000FFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF) << 64);
        _v = (_v >> 128) | (_v << 128);
        return bytes32(_v);
    }

    function restoreMerkleRoot(
        bytes32 _leaf,
        uint256 _index,
        bytes32[] memory _branch
    ) internal pure returns (bytes32) {
        require(2 ** (_branch.length + 1) > _index, "incorrect branch length or index size");
        bytes32 value = _leaf;
        uint256 i = 0;
        while (_index != 1) {
            if (_index % 2 == 1) {
                value = sha256(bytes.concat(_branch[i], value));
            } else {
                value = sha256(bytes.concat(value, _branch[i]));
            }
            _index /= 2;
            i++;
        }
        return value;
    }

    function isValidMerkleBranch(
        bytes32 _leaf,
        uint256 _index,
        bytes32[] memory _branch,
        bytes32 _root
    ) internal pure returns (bool) {
        bytes32 restoredMerkleRoot = restoreMerkleRoot(_leaf, _index, _branch);
        return _root == restoredMerkleRoot;
    }

    function verifyBlockNumber(
        uint256 _blockNumber,
        bytes32[] memory _blockNumberProof,
        bytes32 _headerRoot
    ) internal pure returns (bool) {
        return
            isValidMerkleBranch(
                toLittleEndian(_blockNumber),
                EXECUTION_PAYLOAD_BLOCK_NUMBER_INDEX,
                _blockNumberProof,
                _headerRoot
            );
    }

    function verifyBlockHash(
        bytes32 _blockHash,
        bytes32[] memory _blockHashProof,
        bytes32 _headerRoot
    ) internal pure returns (bool) {
        return isValidMerkleBranch(_blockHash, EXECUTION_PAYLOAD_BLOCK_HASH_INDEX, _blockHashProof, _headerRoot);
    }
}
