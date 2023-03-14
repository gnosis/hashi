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

    function proveHeaders(uint256 chainId, bytes32[] memory blockHeaders, bytes[] memory blockHeaderContents) external {
        if (blockHeaders.length != blockHeaderContents.length) revert("Array Mismatch");

        for (uint256 i = 0; i < blockHeaders.length; i++) {
            RLPReader.RLPItem[] memory blockHeaderContent = RLPReader.toRlpItem(blockHeaderContents[i]).toList();

            bytes32 blockHeader = blockHeaders[i];

            if (blockHeader != keccak256(blockHeaderContents[i])) revert("Header Mismatch");

            bytes32 blockParent = bytes32(blockHeaderContent[0].toUint());
            uint256 blockNumber = uint256(blockHeaderContent[8].toUint());

            if (headers[chainId][blockNumber] != blockHeader) revert("Proof doesn't match up");

            headers[chainId][blockNumber - 1] = blockParent;

            emit HeaderNewStored(blockNumber, blockHeader);
        }
    }
}
