// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "./IOracleAdapter.sol";

import "solidity-rlp/contracts/RLPReader.sol";

contract OracleAdapter is IOracleAdapter {
    mapping(uint256 => mapping(uint256 => bytes32)) public headers;

    using RLPReader for RLPReader.RLPItem;

    function getHeaderFromOracle(uint256 chainId, uint256 blockNumber) external view returns (bytes32 blockHeader) {
        blockHeader = headers[chainId][blockNumber];
    }

    function proveAncestralHeaders(uint256 chainId, bytes[] memory blockHeaderProofs) external {
        for (uint256 i = 0; i < blockHeaderProofs.length; i++) {
            RLPReader.RLPItem memory blockHeaderRLP = RLPReader.toRlpItem(blockHeaderProofs[i]);

            if (!blockHeaderRLP.isList()) revert InvalidBlockHeaderProofRLP();

            RLPReader.RLPItem[] memory blockHeaderContent = blockHeaderRLP.toList();

            // A block header should have between 15 and 17 elements (baseFee and withdrawalsRoot have been added later)
            if (blockHeaderContent.length < 15 || blockHeaderContent.length > 17)
                revert InvalidBlockHeaderProofLength(blockHeaderContent.length);

            bytes32 blockHeader = keccak256(blockHeaderProofs[i]);
            bytes32 blockParent = bytes32(blockHeaderContent[0].toUint());
            uint256 blockNumber = uint256(blockHeaderContent[8].toUint());

            if (headers[chainId][blockNumber] != blockHeader) revert InvalidBlockHeaderProof(blockNumber, blockHeader);

            headers[chainId][blockNumber - 1] = blockParent;

            emit HeaderStored(blockNumber - 1, blockParent);
        }
    }
}
