// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { IHashi } from "./IHashi.sol";
import { IAdapter } from "./IAdapter.sol";

/**
 * @title IShuSho
 */
interface IShuSho {
    struct Link {
        IAdapter previous;
        IAdapter next;
    }

    event HashiSet(IHashi indexed hashi);
    event Init(address indexed owner, IHashi indexed hashi);
    event AdaptersEnabled(uint256 indexed domain, IAdapter[] adapters);
    event AdaptersDisabled(uint256 indexed domain, IAdapter[] adapters);
    event ThresholdSet(uint256 domain, uint256 threshold);

    error AdapterNotEnabled(IAdapter adapter);
    error AdapterAlreadyEnabled(IAdapter adapter);
    error DuplicateHashiAddress(IHashi hashi);
    error DuplicateOrOutOfOrderAdapters(IAdapter adapterOne, IAdapter adapterTwo);
    error DuplicateThreashold(uint256 threshold);
    error InvalidAdapter(IAdapter adapter);
    error NoAdaptersEnabled(uint256 domain);
    error NoAdaptersGiven();
    error ThresholdNotMet();

    /**
     * @dev Checks the order and validity of adapters for a given domain.
     * @param domain - The Uint256 identifier for the domain.
     * @param _adapters - An array of adapter instances.
     */
    function checkAdapterOrderAndValidity(uint256 domain, IAdapter[] memory _adapters) external view;
}
