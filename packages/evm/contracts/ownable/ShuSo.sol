// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Hashi, IOracleAdapter } from "../Hashi.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { Domain } from "../interfaces/IDomain.sol";

struct Link {
    IOracleAdapter previous;
    IOracleAdapter next;
}

abstract contract ShuSo is OwnableUpgradeable {
    IOracleAdapter internal constant LIST_END = IOracleAdapter(address(0x1));

    Hashi public hashi;
    mapping(uint256 => mapping(IOracleAdapter => Link)) public adapters;
    mapping(uint256 => Domain) public domains;

    event HashiSet(address indexed emitter, Hashi indexed hashi);
    event Init(address indexed emitter, address indexed owner, Hashi indexed hashi);
    event OracleAdaptersEnabled(address indexed emitter, uint256 indexed domain, IOracleAdapter[] adapters);
    event OracleAdaptersDisabled(address indexed emitter, uint256 indexed domain, IOracleAdapter[] adapters);
    event ThresholdSet(address indexed emitter, uint256 domain, uint256 threshold);

    error AdapterNotEnabled(address emitter, IOracleAdapter adapter);
    error AdapterAlreadyEnabled(address emitter, IOracleAdapter adapter);
    error DuplicateHashiAddress(address emitter, Hashi hashi);
    error DuplicateOrOutOfOrderAdapters(address emitter, IOracleAdapter adapterOne, IOracleAdapter adapterTwo);
    error DuplicateThreashold(address emitter, uint256 threshold);
    error InvalidAdapter(address emitter, IOracleAdapter adapter);
    error NoAdaptersEnabled(address emitter, uint256 domain);
    error NoAdaptersGiven(address emitter);
    error ThresholdNotMet(address emitter);

    constructor(address _owner, address _hashi) {
        bytes memory initParams = abi.encode(_owner, _hashi);
        init(initParams);
    }

    function init(bytes memory initParams) public initializer {
        (address _owner, Hashi _hashi) = abi.decode(initParams, (address, Hashi));
        __Ownable_init();
        setHashi(_hashi);
        transferOwnership(_owner);
        emit Init(address(this), _owner, _hashi);
    }

    function setHashi(Hashi _hashi) public virtual;

    /// @dev Sets the address of the Hashi contract.
    /// @param _hashi Address of the hashi contract.
    /// @notice Only callable by the owner of this contract.
    function _setHashi(Hashi _hashi) internal onlyOwner {
        if (hashi == _hashi) revert DuplicateHashiAddress(address(this), _hashi);
        hashi = _hashi;
        emit HashiSet(address(this), hashi);
    }

    /// @dev Sets the threshold of adapters required for a given domain.
    /// @param domain Uint256 identifier for the domain for which to set the threshold.
    /// @param threshold Uint256 threshold to set for the given domain.
    /// @notice Only callable by the owner of this contract.
    /// @notice Reverts if threshold is already set to the given value.
    function _setThreshold(uint256 domain, uint256 threshold) internal onlyOwner {
        if (domains[domain].threshold == threshold) revert DuplicateThreashold(address(this), threshold);
        domains[domain].threshold = threshold;
        emit ThresholdSet(address(this), domain, threshold);
    }

    /// @dev Enables the given adapters for a given domain.
    /// @param domain Uint256 identifier for the domain for which to set oracle adapters.
    /// @param _adapters Array of oracleAdapter addresses.
    /// @notice Reverts if _adapters are out of order or contain duplicates.
    /// @notice Only callable by the owner of this contract.
    function _enableOracleAdapters(uint256 domain, IOracleAdapter[] memory _adapters) internal onlyOwner {
        if (adapters[domain][LIST_END].next == IOracleAdapter(address(0))) {
            adapters[domain][LIST_END].next = LIST_END;
            adapters[domain][LIST_END].previous = LIST_END;
        }
        if (_adapters.length == 0) revert NoAdaptersGiven(address(this));
        for (uint256 i = 0; i < _adapters.length; i++) {
            IOracleAdapter adapter = _adapters[i];
            if (adapter == IOracleAdapter(address(0)) || adapter == LIST_END)
                revert InvalidAdapter(address(this), adapter);
            if (adapters[domain][adapter].next != IOracleAdapter(address(0)))
                revert AdapterAlreadyEnabled(address(this), adapter);
            IOracleAdapter previous = adapters[domain][LIST_END].previous;
            adapters[domain][previous].next = adapter;
            adapters[domain][adapter].previous = previous;
            adapters[domain][LIST_END].previous = adapter;
            adapters[domain][adapter].next = LIST_END;
            domains[domain].count++;
        }
        emit OracleAdaptersEnabled(address(this), domain, _adapters);
    }

    /// @dev Disables the given adapters for a given domain.
    /// @param domain Uint256 identifier for the domain for which to set oracle adapters.
    /// @param _adapters Array of oracleAdapter addresses.
    /// @notice Reverts if _adapters are out of order or contain duplicates.
    /// @notice Only callable by the owner of this contract.
    function _disableOracleAdapters(uint256 domain, IOracleAdapter[] memory _adapters) internal onlyOwner {
        if (domains[domain].count == 0) revert NoAdaptersEnabled(address(this), domain);
        if (_adapters.length == 0) revert NoAdaptersGiven(address(this));
        for (uint256 i = 0; i < _adapters.length; i++) {
            IOracleAdapter adapter = _adapters[i];
            if (adapter == IOracleAdapter(address(0)) || adapter == LIST_END)
                revert InvalidAdapter(address(this), adapter);
            Link memory current = adapters[domain][adapter];
            if (current.next == IOracleAdapter(address(0))) revert AdapterNotEnabled(address(this), adapter);
            IOracleAdapter next = current.next;
            IOracleAdapter previous = current.previous;
            adapters[domain][next].previous = previous;
            adapters[domain][previous].next = next;
            delete adapters[domain][adapter].next;
            delete adapters[domain][adapter].previous;
            domains[domain].count--;
        }
        emit OracleAdaptersDisabled(address(this), domain, _adapters);
    }

    /// @dev Returns an array of enabled oracle adapters for a given domain.
    /// @param domain Uint256 identifier for the domain for which to list oracle adapters.
    function getOracleAdapters(uint256 domain) public view returns (IOracleAdapter[] memory) {
        IOracleAdapter[] memory _adapters = new IOracleAdapter[](domains[domain].count);
        IOracleAdapter currentAdapter = adapters[domain][LIST_END].next;
        for (uint256 i = 0; i < _adapters.length; i++) {
            _adapters[i] = currentAdapter;
            currentAdapter = adapters[domain][currentAdapter].next;
        }
        return _adapters;
    }

    /// @dev Returns the threshold and count for a given domain
    /// @param domain Uint256 identifier for the domain.
    /// @return threshold Uint256 oracle threshold for the given domain.
    /// @return count Uint256 oracle count for the given domain.
    /// @notice If the threshold for a domain has not been set, or is explicitly set to 0, this function will return a
    /// threshold equal to the oracle count for the given domain.
    function getThresholdAndCount(uint256 domain) public view returns (uint256 threshold, uint256 count) {
        threshold = domains[domain].threshold;
        count = domains[domain].count;
        if (threshold == 0) threshold = count;
    }

    function checkAdapterOrderAndValidity(uint256 domain, IOracleAdapter[] memory _adapters) public view {
        for (uint256 i = 0; i < _adapters.length; i++) {
            IOracleAdapter adapter = _adapters[i];
            if (i > 0 && adapter <= _adapters[i - 1])
                revert DuplicateOrOutOfOrderAdapters(address(this), adapter, _adapters[i - 1]);
            if (adapters[domain][adapter].next == IOracleAdapter(address(0)))
                revert InvalidAdapter(address(this), adapter);
        }
    }

    /// @dev Returns the hash unanimously agreed upon by ALL of the enabled oraclesAdapters.
    /// @param domain Uint256 identifier for the domain to query.
    /// @param id Uint256 identifier to query.
    /// @return hash Bytes32 hash agreed upon by the oracles for the given domain.
    /// @notice Reverts if oracles disagree.
    /// @notice Reverts if oracles have not yet reported the hash for the given ID.
    /// @notice Reverts if no oracles are set for the given domain.
    function _getUnanimousHash(uint256 domain, uint256 id) internal view returns (bytes32 hash) {
        IOracleAdapter[] memory _adapters = getOracleAdapters(domain);
        (uint256 threshold, uint256 count) = getThresholdAndCount(domain);
        if (count == 0) revert NoAdaptersEnabled(address(this), domain);
        if (_adapters.length < threshold) revert ThresholdNotMet(address(this));
        hash = hashi.getHash(domain, id, _adapters);
    }

    /// @dev Returns the hash agreed upon by a threshold of the enabled oraclesAdapters.
    /// @param domain Uint256 identifier for the domain to query.
    /// @param id Uint256 identifier to query.
    /// @return hash Bytes32 hash agreed upon by a threshold of the oracles for the given domain.
    /// @notice Reverts if no threshold is not reached.
    /// @notice Reverts if no oracles are set for the given domain.
    function _getThresholdHash(uint256 domain, uint256 id) internal view returns (bytes32 hash) {
        IOracleAdapter[] memory _adapters = getOracleAdapters(domain);
        (uint256 threshold, uint256 count) = getThresholdAndCount(domain);
        if (count == 0) revert NoAdaptersEnabled(address(this), domain);
        if (_adapters.length < threshold) revert ThresholdNotMet(address(this));

        // get hashes
        bytes32[] memory hashes = new bytes32[](_adapters.length);
        for (uint i = 0; i < _adapters.length; i++) {
            try _adapters[i].getHashFromOracle(domain, id) returns (bytes32 currentHash) {
                hashes[i] = currentHash;
            } catch {}
        }

        // find a hash agreed on by a threshold of oracles
        for (uint i = 0; i < hashes.length; i++) {
            bytes32 baseHash = hashes[i];
            if (baseHash == bytes32(0)) continue;

            // increment num for each instance of the curent hash
            uint256 num = 1;
            for (uint j = 0; j < hashes.length; j++) {
                if (baseHash == hashes[j] && i != j) {
                    num++;
                    // return current hash if num equals threshold
                    if (num == threshold) return hashes[i];
                }
            }
        }
        revert ThresholdNotMet(address(this));
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
    function _getHash(
        uint256 domain,
        uint256 id,
        IOracleAdapter[] memory _adapters
    ) internal view returns (bytes32 hash) {
        (uint256 threshold, uint256 count) = getThresholdAndCount(domain);
        if (_adapters.length == 0) revert NoAdaptersGiven(address(this));
        if (count == 0) revert NoAdaptersEnabled(address(this), domain);
        if (_adapters.length < threshold) revert ThresholdNotMet(address(this));
        checkAdapterOrderAndValidity(domain, _adapters);
        hash = hashi.getHash(domain, id, _adapters);
    }
}
