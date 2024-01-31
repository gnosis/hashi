// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { IHashi } from "./IHashi.sol";
import { IAdapter } from "./IAdapter.sol";
import { IShuSho } from "./IShuSho.sol";

/**
 * @title IShoyuBashi
 */
interface IShoyuBashi is IShuSho {
    /**
     * @dev Disables the given adapters for a given domain.
     * @param domain - Uint256 identifier for the domain for which to set adapters.
     * @param adapters - Array of adapter addresses.
     * @notice Only callable by the owner of this contract.
     * @notice Reverts if adapters are out of order or contain duplicates.
     */
    function disableAdapters(uint256 domain, IAdapter[] memory adapters) external;

    /**
     * @dev Enables the given adapters for a given domain.
     * @param domain - Uint256 identifier for the domain for which to set adapters.
     * @param adapters - Array of adapter addresses.
     * @notice Only callable by the owner of this contract.
     * @notice Reverts if adapters are out of order or contain duplicates.
     */
    function enableAdapters(uint256 domain, IAdapter[] memory adapters) external;

    /**
     * @dev Returns the hash unanimously agreed upon by ALL of the enabled adapters.
     * @param domain - Uint256 identifier for the domain to query.
     * @param id - Uint256 identifier to query.
     * @return Bytes32 hash agreed upon by the adapters for the given domain.
     * @notice Revert if the adapters do not yet have the hash for the given ID.
     * @notice Reverts if adapters disagree.
     * @notice Reverts if no adapters are set for the given domain.
     */
    function getUnanimousHash(uint256 domain, uint256 id) external view returns (bytes32);

    /**
     * @dev Returns the hash agreed upon by a threshold of the enabled adapters.
     * @param domain - Uint256 identifier for the domain to query.
     * @param id - Uint256 identifier to query.
     * @return Bytes32 hash agreed upon by a threshold of the adapters for the given domain.
     * @notice Reverts if the threshold is not reached.
     * @notice Reverts if no adapters are set for the given domain.
     */
    function getThresholdHash(uint256 domain, uint256 id) external view returns (bytes32);

    /**
     * @dev Returns the hash unanimously agreed upon by all of the given adapters.
     * @param domain - Uint256 identifier for the domain to query.
     * @param adapters - Array of adapter addresses to query.
     * @param id - Uint256 identifier to query.
     * @return Bytes32 hash agreed upon by the adapters for the given domain.
     * @notice adapters must be in numerical order from smallest to largest and contain no duplicates.
     * @notice Reverts if adapters are out of order or contain duplicates.
     * @notice Reverts if adapters disagree.
     * @notice Revert if the adapters do not yet have the hash for the given ID.
     * @notice Reverts if no adapters are set for the given domain.
     */
    function getHash(uint256 domain, uint256 id, IAdapter[] memory adapters) external view returns (bytes32);

    /**
     * @dev Sets the threshold of adapters required for a given domain.
     * @param domain - Uint256 identifier for the domain for which to set the threshold.
     * @param threshold - Uint256 threshold to set for the given domain.
     * @notice Only callable by the owner of this contract.
     * @notice Reverts if the threshold is already set to the given value.
     */
    function setThreshold(uint256 domain, uint256 threshold) external;
}
