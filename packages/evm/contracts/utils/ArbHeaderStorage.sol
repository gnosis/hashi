// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { IHeaderStorage } from "../interfaces/IHeaderStorage.sol";
import { IArbSys } from "../interfaces/IArbSys.sol";

/// @dev Solidity's blockhash will return pseudo-random bytes32 instead of block hash of Arbitrum block
///      https://docs.arbitrum.io/build-decentralized-apps/arbitrum-vs-ethereum/solidity-support#differences-from-solidity-on-ethereum
///      Need to call precompiled arbBlockHash(uint256 blockNumber) to get actual block hash of Arbitrum
///      https://docs.arbitrum.io/build-decentralized-apps/precompiles/reference#arbsys
contract ArbHeaderStorage is IHeaderStorage {
    mapping(uint256 => bytes32) public headers;

    /// @inheritdoc IHeaderStorage
    function storeBlockHeader(uint256 blockNumber) public returns (bytes32) {
        bytes32 blockHeader = headers[blockNumber];
        if (blockHeader == 0) {
            // ArbSys precompiled contract = 0x0000000000000000000000000000000000000064
            blockHeader = IArbSys(0x0000000000000000000000000000000000000064).arbBlockHash(blockNumber);
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
