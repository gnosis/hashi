// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IOracleAdapter } from "./IOracleAdapter.sol";

interface IHashi {
    error NoOracleAdaptersGiven(address emitter);
    error OracleDidNotReport(address emitter, IOracleAdapter oracleAdapter);
    error OraclesDisagree(address emitter, IOracleAdapter oracleOne, IOracleAdapter oracleTwo);

    function getHashFromOracle(
        IOracleAdapter oracleAdapter,
        uint256 domain,
        bytes32 id
    ) external view returns (bytes32 hash);

    function getHashesFromOracles(
        IOracleAdapter[] memory oracleAdapters,
        uint256 domain,
        bytes32 id
    ) external view returns (bytes32[] memory);

    function getHash(
        uint256 domain,
        bytes32 id,
        IOracleAdapter[] memory oracleAdapters
    ) external view returns (bytes32 hash);
}
