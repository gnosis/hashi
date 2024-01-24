// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IOracleAdapter } from "../interfaces/IOracleAdapter.sol";

abstract contract OracleAdapter is IOracleAdapter {
    mapping(uint256 => mapping(uint256 => bytes32)) public hashes;

    /// @inheritdoc IOracleAdapter
    function getHashFromOracle(uint256 domain, uint256 id) external view returns (bytes32 hash) {
        hash = hashes[domain][id];
    }

    function _storeHashes(uint256 domain, uint256[] memory ids, bytes32[] memory hashes_) internal {
        for (uint256 i = 0; i < ids.length; ) {
            _storeHash(domain, ids[i], hashes_[i]);
            unchecked {
                ++i;
            }
        }
    }

    function _storeHash(uint256 domain, uint256 id, bytes32 hash) internal {
        bytes32 currentHash = hashes[domain][id];
        if (currentHash != hash) {
            hashes[domain][id] = hash;
            emit HashStored(id, hash);
        }
    }
}
