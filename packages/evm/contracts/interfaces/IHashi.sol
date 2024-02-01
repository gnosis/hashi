// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { IAdapter } from "./IAdapter.sol";

/**
 * @title IHashi
 */
interface IHashi {
    error AdaptersDisagree(IAdapter adapterOne, IAdapter adapterTwo);
    error HashNotAvailableInAdapter(IAdapter adapter);
    error InvalidThreshold(uint256 threshold, uint256 maxThreshold);
    error NoAdaptersGiven();

    /**
     * @dev Checks whether the threshold is reached for a message given a set of adapters.
     * @param domain - ID of the domain to query.
     * @param id - ID for which to return hash.
     * @param threshold - Threshold to use.
     * @param adapters - Array of addresses for the adapters to query.
     * @notice If the threshold is 1, it will always return true.
     * @return result A boolean indicating if a threshold for a given message has been reached.
     */
    function checkHashWithThresholdFromAdapters(
        uint256 domain,
        uint256 id,
        uint256 threshold,
        IAdapter[] calldata adapters
    ) external view returns (bool);

    /**
     * @dev Returns the hash stored by a given adapter for a given ID.
     * @param domain - ID of the domain to query.
     * @param id - ID for which to return a hash.
     * @param adapter - Address of the adapter to query.
     * @return hash stored by the given adapter for the given ID.
     */
    function getHashFromAdapter(uint256 domain, uint256 id, IAdapter adapter) external view returns (bytes32);

    /**
     * @dev Returns the hashes for a given ID stored by a given set of adapters.
     * @param domain - The ID of the domain to query.
     * @param id - The ID for which to return hashes.
     * @param adapters - An array of addresses for the adapters to query.
     * @return hashes An array of hashes stored by the given adapters for the specified ID.
     */
    function getHashesFromAdapters(
        uint256 domain,
        uint256 id,
        IAdapter[] calldata adapters
    ) external view returns (bytes32[] memory);

    /**
     * @dev Returns the hash unanimously agreed upon by a given set of adapters.
     * @param domain - The ID of the domain to query.
     * @param id - The ID for which to return a hash.
     * @param adapters - An array of addresses for the adapters to query.
     * @return hash agreed on by the given set of adapters.
     * @notice MUST revert if adapters disagree on the hash or if an adapter does not report.
     */
    function getHash(uint256 domain, uint256 id, IAdapter[] calldata adapters) external view returns (bytes32);
}
