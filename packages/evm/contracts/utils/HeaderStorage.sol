// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IHeaderStorage } from "../interfaces/IHeaderStorage.sol";

contract HeaderStorage is IHeaderStorage {
    mapping(uint256 => bytes32) public headers;

    /// @inheritdoc IHeaderStorage
    function storeBlockHeader(uint256 blockNumber) public returns (bytes32) {
        bytes32 blockHeader = headers[blockNumber];
        if (blockHeader == 0) {
            blockHeader = blockhash(blockNumber);
            if (blockHeader == 0) revert HeaderOutOfRange(blockNumber);
            headers[blockNumber] = blockHeader;
            emit HeaderStored(blockNumber, blockHeader);
        }
        return blockHeader;
    }

    /// @inheritdoc IHeaderStorage
    function storeBlockHeaders(uint256[] memory blockNumbers) public returns (bytes32[] memory) {
        bytes32[] memory blockHeaders = new bytes32[](blockNumbers.length);
        for (uint256 i = 0; i < blockNumbers.length; ) {
            blockHeaders[i] = storeBlockHeader(blockNumbers[i]);
            unchecked {
                ++i;
            }
        }
        return blockHeaders;
    }
}
