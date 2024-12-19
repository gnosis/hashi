// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

library BatchMerkleTree {
    error InvalidNodeLength();
    error InvalidPosition();
    error InvalidNodeExpected33Bytes();

    function verify(bytes[][] calldata proof, bytes32 targetNode, bytes32 root) internal pure returns (bool) {
        bytes[] memory batchProof;
        for (uint256 i = 0; i < proof.length; i++) {
            if (proof[i].length != 1) {
                batchProof = proof[i];
            }
        }

        bytes32 batchRoot = targetNode;
        for (uint256 i = 0; i < batchProof.length; i++) {
            bytes memory node = batchProof[i];

            if (node.length != 33) revert InvalidNodeLength();
            uint8 position = uint8(node[32]);
            if (position != 1 && position != 2) revert InvalidPosition();
            bytes32 data = bytes32(node);

            bool isLeftNode = position == 1;
            batchRoot = isLeftNode ? hashNodes(data, batchRoot) : hashNodes(batchRoot, data);
        }

        bytes32[] memory batchRoots = new bytes32[](proof.length);
        for (uint256 i = 0; i < proof.length; i++) {
            bytes[] memory batch = proof[i];
            // targetNode is the onlyElement in this batch
            if (batch.length == 0)
                batchRoots[i] = targetNode;
                // batch that contains only the root
            else if (batch.length == 1) {
                bytes memory batchRootNode = batch[0];
                if (batchRootNode.length != 33) revert InvalidNodeExpected33Bytes();
                uint8 position = uint8(batchRootNode[32]);
                if (position != 0) revert InvalidPosition();
                batchRoots[i] = bytes32(batchRootNode);
            } else {
                batchRoots[i] = batchRoot;
            }
        }

        bytes32 calculatedRoot = batchRoots.length > 1 ? hashNodes(batchRoots[0], batchRoots[1]) : batchRoots[0];
        for (uint256 i = 2; i < batchRoots.length; i++) {
            calculatedRoot = hashNodes(calculatedRoot, batchRoots[i]);
        }

        return calculatedRoot == root;
    }

    function hashNodes(bytes32 node1, bytes32 node2) internal pure returns (bytes32) {
        return sha256(abi.encodePacked(node1, node2));
    }
}
