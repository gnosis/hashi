// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Adapter } from "../adapters/Adapter.sol";
import { BlockHashAdapter } from "../adapters/BlockHashAdapter.sol";

contract MockAdapter is Adapter, BlockHashAdapter {
    error LengthMismatch();

    function setHashes(uint256 domain, uint256[] memory ids, bytes32[] memory hashes) external {
        if (ids.length != hashes.length) revert LengthMismatch();
        for (uint256 i = 0; i < ids.length; i++) {
            _storeHash(domain, ids[i], hashes[i]);
        }
    }
}
