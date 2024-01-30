// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { IHashi } from "./IHashi.sol";
import { IOracleAdapter } from "./IOracleAdapter.sol";

/**
 * @title IShuSho
 */
interface IShuSho {
    struct Link {
        IOracleAdapter previous;
        IOracleAdapter next;
    }

    event HashiSet(IHashi indexed hashi);
    event Init(address indexed owner, IHashi indexed hashi);
    event OracleAdaptersEnabled(uint256 indexed domain, IOracleAdapter[] adapters);
    event OracleAdaptersDisabled(uint256 indexed domain, IOracleAdapter[] adapters);
    event ThresholdSet(uint256 domain, uint256 threshold);

    error AdapterNotEnabled(IOracleAdapter adapter);
    error AdapterAlreadyEnabled(IOracleAdapter adapter);
    error DuplicateHashiAddress(IHashi hashi);
    error DuplicateOrOutOfOrderAdapters(IOracleAdapter adapterOne, IOracleAdapter adapterTwo);
    error DuplicateThreashold(uint256 threshold);
    error InvalidAdapter(IOracleAdapter adapter);
    error NoAdaptersEnabled(uint256 domain);
    error NoAdaptersGiven();
    error ThresholdNotMet();

    /**
     * @dev Checks the order and validity of oracle adapters for a given domain.
     * @param domain - The Uint256 identifier for the domain.
     * @param _adapters - An array of oracle adapter instances.
     */
    function checkAdapterOrderAndValidity(uint256 domain, IOracleAdapter[] memory _adapters) external view;
}
