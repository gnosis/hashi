// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IOracleAdapter } from "./IOracleAdapter.sol";

interface IHashi {
    error NoOracleAdaptersGiven();
    error OracleDidNotReport(IOracleAdapter oracleAdapter);
    error OraclesDisagree(IOracleAdapter oracleOne, IOracleAdapter oracleTwo);

    /// @dev Checks whether threshold is reached for a message given a set of oracleAdapters
    /// @param domain ID of the domain to query.
    /// @param id ID for which to return hash.
    /// @param threshold to use.
    /// @param oracleAdapters Array of address for the oracle adapters to query.
    /// @return a boolean indicating if a threshold for a given message has been reached.
    function checkHashWithThresholdFromOracles(
        uint256 domain,
        uint256 id,
        uint256 threshold,
        IOracleAdapter[] calldata oracleAdapters
    ) external view returns (bool);

    /// @dev Returns the hash reported by a given oracle for a given ID.
    /// @param domain Id of the domain to query.
    /// @param id ID for which to return a hash.
    /// @param oracleAdapter Address of the oracle adapter to query.
    /// @return hash Hash reported by the given oracle adapter for the given ID number.
    function getHashFromOracle(
        uint256 domain,
        uint256 id,
        IOracleAdapter oracleAdapter
    ) external view returns (bytes32);

    /// @dev Returns the hash for a given ID reported by a given set of oracles.
    /// @param domain ID of the domain to query.
    /// @param id ID for which to return hashs.
    /// @param oracleAdapters Array of address for the oracle adapters to query.
    /// @return hashes Array of hash reported by the given oracle adapters for the given ID.
    function getHashesFromOracles(
        uint256 domain,
        uint256 id,
        IOracleAdapter[] calldata oracleAdapters
    ) external view returns (bytes32[] memory);

    /// @dev Returns the hash unanimously agreed upon by a given set of oracles.
    /// @param domain ID of the domain to query.
    /// @param id ID for which to return hash.
    /// @param oracleAdapters Array of address for the oracle adapters to query.
    /// @return hash Hash agreed on by the given set of oracle adapters.
    /// @notice MUST revert if oracles disagree on the hash or if an oracle does not report.
    function getHash(
        uint256 domain,
        uint256 id,
        IOracleAdapter[] calldata oracleAdapters
    ) external view returns (bytes32);
}
