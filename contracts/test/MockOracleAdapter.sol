// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "../adapters/IOracleAdapter.sol";

contract MockOracleAdapter is IOracleAdapter {
    mapping(uint256 => mapping(uint256 => bytes32)) public hashes;

    error LengthMismatch(address emitter);

    function getHashFromOracle(uint256 domain, uint256 id) external view returns (bytes32 hash) {
        hash = hashes[domain][id];
    }

    function setHashes(uint256 domain, uint256[] memory ids, bytes32[] memory _hashes) external {
        if (ids.length != _hashes.length) revert LengthMismatch(address(this));
        for (uint i = 0; i < ids.length; i++) {
            hashes[domain][ids[i]] = _hashes[i];
        }
    }
}
