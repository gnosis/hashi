// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IOracleAdapter } from "./IOracleAdapter.sol";

interface IHashi {
    function getHash(
        uint256 domain,
        uint256 id,
        IOracleAdapter[] memory oracleAdapters
    ) external view returns (bytes32 hash);
}
