/*
                  ███▄▄▄                               ,▄▄███▄
                  ████▀`                      ,╓▄▄▄████████████▄
                  ███▌             ,╓▄▄▄▄█████████▀▀▀▀▀▀╙└`
                  ███▌       ▀▀▀▀▀▀▀▀▀▀╙└└-  ████L
                  ███▌                      ████`               ╓██▄
                  ███▌    ╓▄    ╓╓╓╓╓╓╓╓╓╓╓████▄╓╓╓╓╓╓╓╓╓╓╓╓╓╓▄███████▄
                  ███▌  ▄█████▄ ▀▀▀▀▀▀▀▀▀▀████▀▀▀▀▀▀██▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
         ███████████████████████_       ▄███▀        ██µ
                 ▐███▌                ,███▀           ▀██µ
                 ████▌               ▄███▌,           ▄████▄
                ▐████▌             ▄██▀████▀▀▀▀▀▀▀▀▀▀█████▀███▄
               ,█████▌          ,▄██▀_ ▓███          ▐███_  ▀████▄▄
               ██████▌,       ▄██▀_    ▓███          ▐███_    ▀███████▄-
              ███▀███▌▀███▄  ╙"        ▓███▄▄▄▄▄▄▄▄▄▄▄███_      `▀███└
             ▄██^ ███▌  ^████▄         ▓███▀▀▀▀▀▀▀▀▀▀▀███_         `
            ▄██_  ███▌    ╙███         ▓██▀          └▀▀_        ▄,
           ██▀    ███▌      ▀└ ▐███▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄████▄µ
          ██^     ███▌         ▐███▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀██████▀
        ╓█▀       ███▌         ▐███⌐      µ          ╓          ▐███
        ▀         ███▌         ▐███⌐      ███▄▄▄▄▄▄▄████▄       ▐███
                  ███▌         ▐███⌐      ████▀▀▀▀▀▀▀████▀      ▐███
                  ███▌         ▐███⌐      ███▌      J███M       ▐███
                  ███▌         ▐███⌐      ███▌      J███M       ▐███
                  ███▌         ▐███⌐      ████▄▄▄▄▄▄████M       ▐███
                  ███▌         ▐███⌐      ███▌      ▐███M       ▐███
                  ███▌         ▐███⌐      ███▌       ▀▀_        ████
                  ███▌         ▐███⌐      ▀▀_             ▀▀▀███████
                  ███^         ▐███_                          ▐██▀▀　

                                           Made with ❤️ by Gnosis Guild
*/
// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Hashi, IOracleAdapter } from "./Hashi.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

struct Link {
    IOracleAdapter previous;
    IOracleAdapter next;
}

struct Domain {
    uint256 threshold;
    uint256 count;
}

contract GiriGiriBashi is OwnableUpgradeable {
    IOracleAdapter internal constant LIST_END = IOracleAdapter(address(0x1));

    Hashi public hashi;
    mapping(uint256 => mapping(IOracleAdapter => Link)) public adapters;
    mapping(uint256 => Domain) public domains;

    event HashiSet(address indexed emitter, Hashi indexed hashi);
    event Init(address indexed emitter, address indexed owner, Hashi indexed hashi);
    event OracleAdaptersEnabled(address indexed emitter, uint256 indexed domainId, IOracleAdapter[] adapters);
    event OracleAdaptersDisabled(address indexed emitter, uint256 indexed domainId, IOracleAdapter[] adapters);
    event ThresholdSet(address indexed emitter, uint256 domainId, uint256 threshold);

    error AdapterNotEnabled(address emitter, IOracleAdapter adapter);
    error AdapterAlreadyEnabled(address emitter, IOracleAdapter adapter);
    error DuplicateHashiAddress(address emitter, Hashi hashi);
    error DuplicateOrOutOfOrderAdapters(address emitter, IOracleAdapter adapterOne, IOracleAdapter adapterTwo);
    error DuplicateThreashold(address emitter, uint256 threshold);
    error InvalidAdapter(address emitter, IOracleAdapter adapter);
    error NoAdaptersEnabled(address emitter, uint256 domainId);
    error NoAdaptersGiven(address emitter);
    error SetupAdaptersAlreadyCalled(address emitter);
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

    /// @dev Sets the address of the Hashi contract.
    /// @param _hashi Address of the hashi contract.
    /// @notice Only callable by the owner of this contract.
    function setHashi(Hashi _hashi) public onlyOwner {
        if (hashi == _hashi) revert DuplicateHashiAddress(address(this), _hashi);
        hashi = _hashi;
        emit HashiSet(address(this), hashi);
    }

    /// @dev Sets the threshold of adapters required for a given domainId.
    /// @param domainId Uint256 identifier for the domain for which to set the threshold.
    /// @param threshold Uint256 threshold to set for the given domain.
    /// @notice Only callable by the owner of this contract.
    /// @notice Reverts if threshold is already set to the given value.
    function setThreshold(uint256 domainId, uint256 threshold) public onlyOwner {
        if (domains[domainId].threshold == threshold) revert DuplicateThreashold(address(this), threshold);
        domains[domainId].threshold = threshold;
        emit ThresholdSet(address(this), domainId, threshold);
    }

    /// @dev Enables the given adapters for a given domainId.
    /// @param domainId Uint256 identifier for the domain for which to set oracle adapters.
    /// @param _adapters Arracy of oracleAdapter addresses.
    /// @notice Reverts if _adapters are out of order or contain duplicates.
    /// @notice Only callable by the owner of this contract.
    function enableOracleAdapters(uint256 domainId, IOracleAdapter[] memory _adapters) public onlyOwner {
        if (adapters[domainId][LIST_END].next == IOracleAdapter(address(0))) {
            adapters[domainId][LIST_END].next = LIST_END;
            adapters[domainId][LIST_END].previous = LIST_END;
        }
        if (_adapters.length == 0) revert NoAdaptersGiven(address(this));
        for (uint256 i = 0; i < _adapters.length; i++) {
            IOracleAdapter adapter = _adapters[i];
            if (adapter == IOracleAdapter(address(0)) || adapter == LIST_END)
                revert InvalidAdapter(address(this), adapter);
            if (adapters[domainId][adapter].next != IOracleAdapter(address(0)))
                revert AdapterAlreadyEnabled(address(this), adapter);
            IOracleAdapter previous = adapters[domainId][LIST_END].previous;
            adapters[domainId][previous].next = adapter;
            adapters[domainId][adapter].previous = previous;
            adapters[domainId][LIST_END].previous = adapter;
            adapters[domainId][adapter].next = LIST_END;
            domains[domainId].count++;
        }
        emit OracleAdaptersEnabled(address(this), domainId, _adapters);
    }

    /// @dev Disables the given adapters for a given domainId.
    /// @param domainId Uint256 identifier for the domain for which to set oracle adapters.
    /// @param _adapters Arracy of oracleAdapter addresses.
    /// @notice Reverts if _adapters are out of order or contain duplicates.
    /// @notice Only callable by the owner of this contract.
    function disableOracleAdapters(uint256 domainId, IOracleAdapter[] memory _adapters) public onlyOwner {
        if (domains[domainId].count == 0) revert NoAdaptersEnabled(address(this), domainId);
        if (_adapters.length == 0) revert NoAdaptersGiven(address(this));
        for (uint256 i = 0; i < _adapters.length; i++) {
            IOracleAdapter adapter = _adapters[i];
            if (adapter == IOracleAdapter(address(0)) || adapter == LIST_END)
                revert InvalidAdapter(address(this), adapter);
            Link memory current = adapters[domainId][adapter];
            if (current.next == IOracleAdapter(address(0))) revert AdapterNotEnabled(address(this), adapter);
            IOracleAdapter next = current.next;
            IOracleAdapter previous = current.previous;
            adapters[domainId][next].previous = previous;
            adapters[domainId][previous].next = next;
            delete adapters[domainId][adapter].next;
            delete adapters[domainId][adapter].previous;
            domains[domainId].count--;
        }
        emit OracleAdaptersDisabled(address(this), domainId, _adapters);
    }

    /// @dev Returns an array of enabled oracle adapters for a given domainId.
    /// @param domainId Uint256 identifier for the domain for which to list oracle adapters.
    function getOracleAdapters(uint256 domainId) public view returns (IOracleAdapter[] memory) {
        IOracleAdapter[] memory _adapters = new IOracleAdapter[](domains[domainId].count);
        IOracleAdapter currentAdapter = adapters[domainId][LIST_END].next;
        for (uint256 i = 0; i < _adapters.length; i++) {
            _adapters[i] = currentAdapter;
            currentAdapter = adapters[domainId][currentAdapter].next;
        }
        return _adapters;
    }

    /// @dev Returns the threshold and count for a given domainId
    /// @param domainId Uint256 identifier for the domain.
    /// @return threshold Uint256 oracle threshold for the given domainId.
    /// @return count Uint256 oracle count for the given domainId.
    /// @notice If the threshold for a domain has not been set, or is explicitly set to 0, this function will return a
    /// threshold equal to the oracle count for the given domain.
    function getThresholdAndCount(uint256 domainId) public view returns (uint256 threshold, uint256 count) {
        threshold = domains[domainId].threshold;
        count = domains[domainId].count;
        if (threshold == 0) threshold = count;
    }

    /// @dev Returns the hash unanimously agreed upon by ALL of the enabled oraclesAdapters.
    /// @param domainId Uint256 identifier for the domain to query.
    /// @param id Uint256 identifier to query.
    /// @return hash Bytes32 hash agreed upon by the oracles for the given domainId.
    /// @notice Reverts if _adapters are out of order or contain duplicates.`
    /// @notice Reverts if oracles disagree.
    /// @notice Reverts if oracles have not yet reported the hash for the given ID.
    /// @notice Reverts if the no oracles are set for the given domainId.
    function getUnanimousHash(uint256 domainId, uint256 id) public view returns (bytes32 hash) {
        IOracleAdapter[] memory _adapters = getOracleAdapters(domainId);
        (uint256 threshold, uint256 count) = getThresholdAndCount(domainId);
        if (count == 0) revert NoAdaptersEnabled(address(this), domainId);
        if (_adapters.length < threshold) revert ThresholdNotMet(address(this));
        hash = hashi.getHash(domainId, id, _adapters);
    }

    /// @dev Returns the hash unanimously agreed upon by all of the given oraclesAdapters..
    /// @param domainId Uint256 identifier for the domain to query.
    /// @param _adapters Array of oracle adapter addresses to query.
    /// @param id Uint256 identifier to query.
    /// @return hash Bytes32 hash agreed upon by the oracles for the given domainId.
    /// @notice _adapters must be in numberical order from smallest to largest and contain no duplicates.
    /// @notice Reverts if _adapters are out of order or contain duplicates.
    /// @notice Reverts if oracles disagree.
    /// @notice Reverts if oracles have not yet reported the hash for the given ID.
    /// @notice Reverts if the no oracles are set for the given domainId.
    /// @notice Reverts if the no oracles are set for the given domainId.
    function getHash(
        uint256 domainId,
        uint256 id,
        IOracleAdapter[] memory _adapters
    ) public view returns (bytes32 hash) {
        (uint256 threshold, uint256 count) = getThresholdAndCount(domainId);
        if (_adapters.length == 0) revert NoAdaptersGiven(address(this));
        if (count == 0) revert NoAdaptersEnabled(address(this), domainId);
        if (_adapters.length < threshold) revert ThresholdNotMet(address(this));
        for (uint256 i = 0; i < _adapters.length; i++) {
            IOracleAdapter adapter = _adapters[i];
            if (i > 0 && adapter <= _adapters[i - 1])
                revert DuplicateOrOutOfOrderAdapters(address(this), adapter, _adapters[i - 1]);
            if (adapters[domainId][adapter].next == IOracleAdapter(address(0)))
                revert InvalidAdapter(address(this), adapter);
        }
        hash = hashi.getHash(domainId, id, _adapters);
    }
}
