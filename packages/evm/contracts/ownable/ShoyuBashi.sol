// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Hashi, IOracleAdapter, ShuSo, OwnableUpgradeable } from "./ShuSo.sol";
import { Domain } from "../interfaces/IDomain.sol";

contract ShoyuBashi is ShuSo {
    constructor(address _owner, address _hashi) ShuSo(_owner, _hashi) {}

    /// @dev Sets the address of the Hashi contract.
    /// @param _hashi Address of the hashi contract.
    /// @notice Only callable by the owner of this contract.
    function setHashi(Hashi _hashi) public override {
        _setHashi(_hashi);
    }

    /// @dev Sets the threshold of adapters required for a given domain.
    /// @param domain Uint256 identifier for the domain for which to set the threshold.
    /// @param threshold Uint256 threshold to set for the given domain.
    /// @notice Only callable by the owner of this contract.
    /// @notice Reverts if threshold is already set to the given value.
    function setThreshold(uint256 domain, uint256 threshold) public {
        _setThreshold(domain, threshold);
    }

    /// @dev Enables the given adapters for a given domain.
    /// @param domain Uint256 identifier for the domain for which to set oracle adapters.
    /// @param _adapters Array of oracleAdapter addresses.
    /// @notice Reverts if _adapters are out of order or contain duplicates.
    /// @notice Only callable by the owner of this contract.
    function enableOracleAdapters(uint256 domain, IOracleAdapter[] memory _adapters) public {
        _enableOracleAdapters(domain, _adapters);
    }

    /// @dev Disables the given adapters for a given domain.
    /// @param domain Uint256 identifier for the domain for which to set oracle adapters.
    /// @param _adapters Array of oracleAdapter addresses.
    /// @notice Reverts if _adapters are out of order or contain duplicates.
    /// @notice Only callable by the owner of this contract.
    function disableOracleAdapters(uint256 domain, IOracleAdapter[] memory _adapters) public {
        _disableOracleAdapters(domain, _adapters);
    }

    /// @dev Returns the hash unanimously agreed upon by ALL of the enabled oraclesAdapters.
    /// @param domain Uint256 identifier for the domain to query.
    /// @param id Uint256 identifier to query.
    /// @return hash Bytes32 hash agreed upon by the oracles for the given domain.
    /// @notice Reverts if oracles disagree.
    /// @notice Reverts if oracles have not yet reported the hash for the given ID.
    /// @notice Reverts if no oracles are set for the given domain.
    function getUnanimousHash(uint256 domain, uint256 id) public view returns (bytes32 hash) {
        hash = _getUnanimousHash(domain, id);
    }

    /// @dev Returns the hash agreed upon by a threshold of the enabled oraclesAdapters.
    /// @param domain Uint256 identifier for the domain to query.
    /// @param id Uint256 identifier to query.
    /// @return hash Bytes32 hash agreed upon by a threshold of the oracles for the given domain.
    /// @notice Reverts if no threshold is not reached.
    /// @notice Reverts if no oracles are set for the given domain.
    function getThresholdHash(uint256 domain, uint256 id) public view returns (bytes32 hash) {
        hash = _getThresholdHash(domain, id);
    }

    /// @dev Returns the hash unanimously agreed upon by all of the given oraclesAdapters..
    /// @param domain Uint256 identifier for the domain to query.
    /// @param _adapters Array of oracle adapter addresses to query.
    /// @param id Uint256 identifier to query.
    /// @return hash Bytes32 hash agreed upon by the oracles for the given domain.
    /// @notice _adapters must be in numberical order from smallest to largest and contain no duplicates.
    /// @notice Reverts if _adapters are out of order or contain duplicates.
    /// @notice Reverts if oracles disagree.
    /// @notice Reverts if oracles have not yet reported the hash for the given ID.
    /// @notice Reverts if no oracles are set for the given domain.
    function getHash(uint256 domain, uint256 id, IOracleAdapter[] memory _adapters) public view returns (bytes32 hash) {
        hash = _getHash(domain, id, _adapters);
    }
}
