// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "../adapters/OracleAdapter.sol";
import "../adapters/BlockHashOracleAdapter.sol";

contract MockOracleAdapter is OracleAdapter, BlockHashOracleAdapter {
    error LengthMismatch(address emitter);

    function setHashes(uint256 domain, uint256[] memory ids, bytes32[] memory _hashes) external {
        if (ids.length != _hashes.length) revert LengthMismatch(address(this));
        for (uint i = 0; i < ids.length; i++) {
            _storeHash(domain, ids[i], _hashes[i]);
        }
    }
}
