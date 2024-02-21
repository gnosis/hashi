// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { IHashi } from "./IHashi.sol";
import { IAdapter } from "./IAdapter.sol";

/**
 * @title IShuSho
 */
interface IShuSho {
    struct Domain {
        uint256 threshold;
        uint256 count;
    }

    struct Link {
        IAdapter previous;
        IAdapter next;
    }

    error AdapterNotEnabled(IAdapter adapter);
    error AdapterAlreadyEnabled(IAdapter adapter);
    error CountCannotBeZero();
    error DuplicateHashiAddress(IHashi hashi);
    error DuplicateOrOutOfOrderAdapters(IAdapter adapterOne, IAdapter adapterTwo);
    error DuplicateThreashold(uint256 threshold);
    error InvalidAdapter(IAdapter adapter);
    error InvalidThreshold(uint256 threshold);
    error NoAdaptersEnabled(uint256 domain);
    error NoAdaptersGiven();
    error ThresholdNotMet();

    /**
     * @dev Emitted when adapters are disabled for a specific domain.
     * @param domain - The domain associated with the disabled adapters.
     * @param adapters - An array of disabled adapter addresses associated with this event.
     */
    event AdaptersDisabled(uint256 indexed domain, IAdapter[] adapters);

    /**
     * @dev Emitted when adapters are enabled for a specific domain.
     * @param domain - The domain associated with the enabled adapters.
     * @param adapters - An array of enabled adapter addresses associated with this event.
     */
    event AdaptersEnabled(uint256 indexed domain, IAdapter[] adapters);

    /**
     * @dev Emitted when the address of the IHashi contract is set.
     * @param hashi - The address of the IHashi contract associated with this event.
     */
    event HashiSet(IHashi indexed hashi);

    /**
     * @dev Emitted when initialization occurs with the owner's address and the IHashi contract address.
     * @param owner - The address of the owner associated with this event.
     * @param hashi - The address of the IHashi contract associated with this event.
     */
    event Init(address indexed owner, IHashi indexed hashi);

    /**
     * @dev Emitted when the threshold is set for a specific domain.
     * @param domain - The domain associated with the set threshold.
     * @param threshold - The new threshold value associated with this event.
     */
    event ThresholdSet(uint256 domain, uint256 threshold);

    /**
     * @dev Checks the order and validity of adapters for a given domain.
     * @param domain - The Uint256 identifier for the domain.
     * @param _adapters - An array of adapter instances.
     */
    function checkAdapterOrderAndValidity(uint256 domain, IAdapter[] memory _adapters) external view;

    /**
     * @dev Get the previous and the next adapter given a domain and an adapter.
     * @param domain - Uint256 identifier for the domain.
     * @param adapter - IAdapter value for the adapter.
     * @return link - The Link struct containing the previous and the next adapter.
     */
    function getAdapterLink(uint256 domain, IAdapter adapter) external view returns (Link memory);

    /**
     * @dev Returns an array of enabled adapters for a given domain.
     * @param domain - Uint256 identifier for the domain for which to list adapters.
     * @return adapters - The adapters for a given domain.
     */
    function getAdapters(uint256 domain) external view returns (IAdapter[] memory);

    /**
     * @dev Get the current configuration for a given domain.
     * @param domain - Uint256 identifier for the domain.
     * @return domain - The Domain struct containing the current configuration for a given domain.
     */
    function getDomain(uint256 domain) external view returns (Domain memory);

    /**
     * @dev Returns the threshold and count for a given domain.
     * @param domain - Uint256 identifier for the domain.
     * @return threshold - Uint256 adapters threshold for the given domain.
     * @return count - Uint256 adapters count for the given domain.
     * @notice If the threshold for a domain has not been set, or is explicitly set to 0, this function will return a threshold equal to the adapters count for the given domain.
     */
    function getThresholdAndCount(uint256 domain) external view returns (uint256, uint256);

    /**
     * @dev Returns the address of the specified Hashi.
     * @return hashi - The Hashi address.
     */
    function hashi() external view returns (IHashi);
}
