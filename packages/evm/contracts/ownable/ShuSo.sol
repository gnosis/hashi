// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { IAdapter } from "../interfaces/IAdapter.sol";
import { IHashi } from "../interfaces/IHashi.sol";
import { IShuSho } from "../interfaces/IShuSho.sol";

abstract contract ShuSo is IShuSho, OwnableUpgradeable {
    IAdapter internal constant LIST_END = IAdapter(address(0x1));

    IHashi public hashi;
    mapping(uint256 => mapping(IAdapter => Link)) public adapters;
    mapping(uint256 => Domain) public domains;

    constructor(address _owner, address _hashi) {
        bytes memory initParams = abi.encode(_owner, _hashi);
        init(initParams);
    }

    function init(bytes memory initParams) public initializer {
        (address _owner, IHashi _hashi) = abi.decode(initParams, (address, IHashi));
        __Ownable_init();
        setHashi(_hashi);
        transferOwnership(_owner);
        emit Init(_owner, _hashi);
    }

    /// @inheritdoc IShuSho
    function checkAdapterOrderAndValidity(uint256 domain, IAdapter[] memory _adapters) public view {
        for (uint256 i = 0; i < _adapters.length; i++) {
            IAdapter adapter = _adapters[i];
            if (i > 0 && adapter <= _adapters[i - 1]) revert DuplicateOrOutOfOrderAdapters(adapter, _adapters[i - 1]);
            if (adapters[domain][adapter].next == IAdapter(address(0))) revert InvalidAdapter(adapter);
        }
    }

    /// @inheritdoc IShuSho
    function getAdapters(uint256 domain) public view returns (IAdapter[] memory) {
        IAdapter[] memory _adapters = new IAdapter[](domains[domain].count);
        IAdapter currentAdapter = adapters[domain][LIST_END].next;
        for (uint256 i = 0; i < _adapters.length; i++) {
            _adapters[i] = currentAdapter;
            currentAdapter = adapters[domain][currentAdapter].next;
        }
        return _adapters;
    }

    /// @inheritdoc IShuSho
    function getThresholdAndCount(uint256 domain_) public view returns (uint256, uint256) {
        Domain storage domain = domains[domain_];
        uint256 threshold = domain.threshold;
        uint256 count = domain.count;
        if (threshold == 0) threshold = count;
        return (threshold, count);
    }

    function setHashi(IHashi _hashi) public virtual;

    /**
     * @dev Disables the given adapters for a given domain.
     * @param domain - Uint256 identifier for the domain for which to set adapters.
     * @param _adapters - Array of adapter addresses.
     * @notice Reverts if _adapters are out of order or contain duplicates.
     * @notice Only callable by the owner of this contract.
     */
    function _disableAdapters(uint256 domain, IAdapter[] memory _adapters) internal onlyOwner {
        if (domains[domain].count == 0) revert NoAdaptersEnabled(domain);
        if (_adapters.length == 0) revert NoAdaptersGiven();
        for (uint256 i = 0; i < _adapters.length; i++) {
            IAdapter adapter = _adapters[i];
            if (adapter == IAdapter(address(0)) || adapter == LIST_END) revert InvalidAdapter(adapter);
            Link memory current = adapters[domain][adapter];
            if (current.next == IAdapter(address(0))) revert AdapterNotEnabled(adapter);
            IAdapter next = current.next;
            IAdapter previous = current.previous;
            adapters[domain][next].previous = previous;
            adapters[domain][previous].next = next;
            delete adapters[domain][adapter].next;
            delete adapters[domain][adapter].previous;
            domains[domain].count--;
        }
        emit AdaptersDisabled(domain, _adapters);
    }

    /**
     * @dev Enables the given adapters for a given domain.
     * @param domain - Uint256 identifier for the domain for which to set adapters.
     * @param _adapters - Array of adapter addresses.
     * @notice Reverts if _adapters are out of order or contain duplicates.
     * @notice Only callable by the owner of this contract.
     */
    function _enableAdapters(uint256 domain, IAdapter[] memory _adapters) internal onlyOwner {
        if (adapters[domain][LIST_END].next == IAdapter(address(0))) {
            adapters[domain][LIST_END].next = LIST_END;
            adapters[domain][LIST_END].previous = LIST_END;
        }
        if (_adapters.length == 0) revert NoAdaptersGiven();
        for (uint256 i = 0; i < _adapters.length; i++) {
            IAdapter adapter = _adapters[i];
            if (adapter == IAdapter(address(0)) || adapter == LIST_END) revert InvalidAdapter(adapter);
            if (adapters[domain][adapter].next != IAdapter(address(0))) revert AdapterAlreadyEnabled(adapter);
            IAdapter previous = adapters[domain][LIST_END].previous;
            adapters[domain][previous].next = adapter;
            adapters[domain][adapter].previous = previous;
            adapters[domain][LIST_END].previous = adapter;
            adapters[domain][adapter].next = LIST_END;
            domains[domain].count++;
        }
        emit AdaptersEnabled(domain, _adapters);
    }

    /**
     * @dev Returns the hash unanimously agreed upon by all of the given adapters.
     * @param domain - Uint256 identifier for the domain to query.
     * @param id - Uint256 identifier to query.
     * @param _adapters - Array of adapter addresses to query.
     * @return hash - Bytes32 hash agreed upon by the adapters for the given domain.
     * @notice _adapters must be in numerical order from smallest to largest and contain no duplicates.
     * @notice Reverts if _adapters are out of order or contain duplicates.
     * @notice Reverts if adapters disagree.
     * @notice Revert if the adapters do not yet have the hash for the given ID.
     * @notice Reverts if no adapters are set for the given domain.
     */
    function _getHash(uint256 domain, uint256 id, IAdapter[] memory _adapters) internal view returns (bytes32) {
        (uint256 threshold, uint256 count) = getThresholdAndCount(domain);
        if (_adapters.length == 0) revert NoAdaptersGiven();
        if (count == 0) revert NoAdaptersEnabled(domain);
        if (_adapters.length < threshold) revert ThresholdNotMet();
        checkAdapterOrderAndValidity(domain, _adapters);
        return hashi.getHash(domain, id, _adapters);
    }

    /**
     * @dev Returns the hash agreed upon by a threshold of the enabled adapters.
     * @param domain - Uint256 identifier for the domain to query.
     * @param id - Uint256 identifier to query.
     * @return hash - Bytes32 hash agreed upon by a threshold of the adapters for the given domain.
     * @notice If the threshold is set to 1, the function will return the hash of the first adapter in the list.
     * @notice Reverts if no threshold is not reached.
     * @notice Reverts if no adapters are set for the given domain.
     */
    function _getThresholdHash(uint256 domain, uint256 id) internal view returns (bytes32 hash) {
        IAdapter[] memory _adapters = getAdapters(domain);
        (uint256 threshold, uint256 count) = getThresholdAndCount(domain);
        if (count == 0) revert NoAdaptersEnabled(domain);
        if (_adapters.length < threshold) revert ThresholdNotMet();

        bytes32[] memory hashes = new bytes32[](_adapters.length);
        for (uint i = 0; i < _adapters.length; i++) {
            try _adapters[i].getHash(domain, id) returns (bytes32 currentHash) {
                hashes[i] = currentHash;
            } catch {} // solhint-disable no-empty-blocks
        }

        for (uint i = 0; i < hashes.length; i++) {
            if (i > hashes.length - threshold) break;

            bytes32 baseHash = hashes[i];
            if (baseHash == bytes32(0)) continue;

            uint256 num = 0;
            for (uint j = i; j < hashes.length; j++) {
                if (baseHash == hashes[j]) {
                    num++;
                    if (num == threshold) return hashes[i];
                }
            }
        }
        revert ThresholdNotMet();
    }

    /**
     * @dev Returns the hash unanimously agreed upon by ALL of the enabled adapters.
     * @param domain - Uint256 identifier for the domain to query.
     * @param id - Uint256 identifier to query.
     * @return hash - Bytes32 hash agreed upon by the adapters for the given domain.
     * @notice Reverts if adapters disagree.
     * @notice Revert if the adapters do not yet have the hash for the given ID.
     * @notice Reverts if no adapters are set for the given domain.
     */
    function _getUnanimousHash(uint256 domain, uint256 id) internal view returns (bytes32 hash) {
        IAdapter[] memory _adapters = getAdapters(domain);
        (uint256 threshold, uint256 count) = getThresholdAndCount(domain);
        if (count == 0) revert NoAdaptersEnabled(domain);
        if (_adapters.length < threshold) revert ThresholdNotMet();
        return hashi.getHash(domain, id, _adapters);
    }

    /**
     * @dev Sets the address of the IHashi contract.
     * @param _hashi - Address of the hashi contract.
     * @notice Only callable by the owner of this contract.
     */
    function _setHashi(IHashi _hashi) internal onlyOwner {
        if (hashi == _hashi) revert DuplicateHashiAddress(_hashi);
        hashi = _hashi;
        emit HashiSet(hashi);
    }

    /**
     * @dev Sets the threshold of adapters required for a given domain.
     * @param domain - Uint256 identifier for the domain for which to set the threshold.
     * @param threshold - Uint256 threshold to set for the given domain.
     * @notice Only callable by the owner of this contract.
     * @notice Reverts if threshold is already set to the given value.
     */
    function _setThreshold(uint256 domain, uint256 threshold) internal onlyOwner {
        if (domains[domain].threshold == threshold) revert DuplicateThreashold(threshold);
        domains[domain].threshold = threshold;
        emit ThresholdSet(domain, threshold);
    }
}
