// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

library Merkle {
    uint256 internal constant SLOTS_PER_HISTORICAL_ROOT = 8192;

    function restoreMerkleRoot(
        bytes32[] memory branch,
        bytes32 leaf,
        uint256 index
    ) internal pure returns (bytes32 root) {
        require(index < 2 ** branch.length, "invalid leaf index");

        bytes32 combineHash = leaf;
        uint256 curIndex = index;
        for (uint256 i = 0; i < branch.length; ) {
            if (curIndex % 2 == 0) combineHash = sha256(bytes.concat(combineHash, branch[i]));
            else combineHash = sha256(bytes.concat(branch[i], combineHash));

            curIndex /= 2;

            unchecked {
                i++;
            }
        }

        root = combineHash;
    }

    function verifyReceiptsRoot(
        bytes32[] memory receiptsRootBranch,
        bytes32 receiptsRoot,
        uint64 lcSlot,
        uint64 txSlot,
        bytes32 headerRoot
    ) internal pure returns (bool) {
        uint256 index;
        if (txSlot == lcSlot) {
            index = 3 * (2 ** (5 + 4)) + 24 * (2 ** 4) + 3;
        } else if (lcSlot - txSlot <= SLOTS_PER_HISTORICAL_ROOT) {
            index =
                3 *
                (2 ** (5 + 13 + 5 + 4)) +
                6 *
                (2 ** (13 + 5 + 4)) +
                (txSlot % SLOTS_PER_HISTORICAL_ROOT) *
                (2 ** (5 + 4)) +
                24 *
                (2 ** 4) +
                3;
        } else if (lcSlot - txSlot > SLOTS_PER_HISTORICAL_ROOT) {
            revert("txSlot lags by >8192 blocks. Not supported.");
        } else {
            revert("txSlot can't be greater than lightclient slot");
        }

        bytes32 computedRoot = restoreMerkleRoot(receiptsRootBranch, receiptsRoot, index);
        return computedRoot == headerRoot;
    }
}
