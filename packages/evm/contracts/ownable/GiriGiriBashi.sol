// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { ShuSo } from "./ShuSo.sol";
import { IAdapter } from "../interfaces/IAdapter.sol";
import { IHashi } from "../interfaces/IHashi.sol";
import { IGiriGiriBashi } from "../interfaces/IGiriGiriBashi.sol";

contract GiriGiriBashi is IGiriGiriBashi, ShuSo {
    address payable public bondRecipient; // address that bonds from unsuccessful challenges should be sent to.
    mapping(uint256 => uint256) public heads; // highest Id reported.
    mapping(uint256 => uint256) public challengeRanges; // how far beyond the current highestId can a challenged.
    mapping(uint256 => mapping(IAdapter => Settings)) public settings;
    mapping(bytes32 => Challenge) public challenges; // current challenges.

    constructor(address _owner, address _hashi, address payable _bondRecipient) ShuSo(_owner, _hashi) {
        bondRecipient = _bondRecipient;
    }

    modifier noConfidence(uint256 domain) {
        if (domains[domain].threshold != type(uint256).max) revert NoConfidenceRequired();
        _;
    }

    modifier zeroCount(uint256 domain) {
        if (domains[domain].count != 0) revert CountMustBeZero(domain);
        _;
    }

    /// @inheritdoc IGiriGiriBashi
    function challengeAdapter(uint256 domain, uint256 id, IAdapter adapter) public payable {
        if (adapters[domain][adapter].previous == IAdapter(address(0))) revert AdapterNotEnabled(adapter);
        if (msg.value < settings[domain][adapter].minimumBond) revert NotEnoughValue(adapter, msg.value);
        if (settings[domain][adapter].quarantined) revert AlreadyQuarantined(adapter);

        bytes32 challengeId = getChallengeId(domain, id, adapter);
        if (challenges[challengeId].challenger != address(0))
            revert DuplicateChallenge(challengeId, domain, id, adapter);

        // check if id is lower than startId, revert if true.
        // check if id is less than highestId + challengeRange, revert if false
        // check if id is lower than highestId - idDepth, revert if true
        uint256 challengeRange = challengeRanges[domain];
        uint256 idDepth = settings[domain][adapter].idDepth;
        uint256 head = heads[domain];
        if (
            id < settings[domain][adapter].startId || // before start id
            (challengeRange != 0 && id >= head && id - head > challengeRange) || // over domain challenge range
            (idDepth != 0 && head > idDepth && id <= head - idDepth) // outside of adapter idDepth
        ) revert OutOfRange(adapter, id);

        Challenge storage challenge = challenges[challengeId];
        challenge.challenger = payable(msg.sender);
        challenge.timestamp = block.timestamp;
        challenge.bond = msg.value;

        emit ChallengeCreated(challengeId, domain, id, adapter, msg.sender, block.timestamp, msg.value);
    }

    /// @inheritdoc IGiriGiriBashi
    function enableAdapters(
        uint256 domain,
        IAdapter[] memory _adapters,
        Settings[] memory _settings
    ) public zeroCount(domain) {
        _enableAdapters(domain, _adapters);
        initSettings(domain, _adapters, _settings);
    }

    /// @inheritdoc IGiriGiriBashi
    function declareNoConfidence(uint256 domain, uint256 id, IAdapter[] memory _adapters) public {
        checkAdapterOrderAndValidity(domain, _adapters);
        (uint256 threshold, uint256 count) = getThresholdAndCount(domain);

        // check that there are enough adapters to prove no confidence
        uint256 confidence = (count - _adapters.length) + 1;
        if (confidence >= threshold) revert CannotProveNoConfidence(domain, id, _adapters);

        bytes32[] memory hashes = new bytes32[](_adapters.length);
        for (uint256 i = 0; i < _adapters.length; i++) hashes[i] = _adapters[i].getHash(domain, id);

        // prove that each member of _adapters disagrees
        for (uint256 i = 0; i < hashes.length; i++)
            for (uint256 j = 0; j < hashes.length; j++)
                if (hashes[i] == hashes[j] && i != j) revert AdaptersAgreed(_adapters[i], _adapters[j]);

        domains[domain].threshold = type(uint256).max;
        delete challengeRanges[domain];

        emit NoConfidenceDeclared(domain);
    }

    /// @inheritdoc IGiriGiriBashi
    function disableAdapters(uint256 domain, IAdapter[] memory _adapters) public noConfidence(domain) {
        _disableAdapters(domain, _adapters);
        if (domains[domain].count == 0) domains[domain].threshold = 0;
    }

    /// @inheritdoc IGiriGiriBashi
    function getChallengeId(uint256 domain, uint256 id, IAdapter adapter) public pure returns (bytes32 challengeId) {
        challengeId = keccak256(abi.encodePacked(domain, id, adapter));
    }

    /// @inheritdoc IGiriGiriBashi
    function getThresholdHash(uint256 domain, uint256 id) public returns (bytes32 hash) {
        hash = _getThresholdHash(domain, id);
        updateHead(domain, id);
    }

    /// @inheritdoc IGiriGiriBashi
    function getUnanimousHash(uint256 domain, uint256 id) public returns (bytes32 hash) {
        hash = _getUnanimousHash(domain, id);
        updateHead(domain, id);
    }

    /// @inheritdoc IGiriGiriBashi
    function getHash(uint256 domain, uint256 id, IAdapter[] memory _adapters) public returns (bytes32 hash) {
        hash = _getHash(domain, id, _adapters);
        updateHead(domain, id);
    }

    /// @inheritdoc IGiriGiriBashi
    function replaceQuarantinedAdapters(
        uint256 domain,
        IAdapter[] memory currentAdapters,
        IAdapter[] memory newAdapters,
        Settings[] memory _settings
    ) public onlyOwner {
        if (currentAdapters.length != newAdapters.length || currentAdapters.length != _settings.length)
            revert UnequalArrayLengths();
        for (uint256 i = 0; i < currentAdapters.length; i++) {
            if (!settings[domain][currentAdapters[i]].quarantined) revert AdapterNotQuarantined(currentAdapters[i]);
        }
        _disableAdapters(domain, currentAdapters);
        _enableAdapters(domain, newAdapters);
        initSettings(domain, newAdapters, _settings);
    }

    /// @inheritdoc IGiriGiriBashi
    function resolveChallenge(
        uint256 domain,
        uint256 id,
        IAdapter adapter,
        IAdapter[] memory _adapters
    ) public returns (bool success) {
        // check if challenge exists, revert if false
        bytes32 challengeId = getChallengeId(domain, id, adapter);
        if (challenges[challengeId].challenger == address(0))
            revert ChallengeNotFound(challengeId, domain, id, adapter);

        Challenge storage challenge = challenges[challengeId];
        Settings storage adapterSettings = settings[domain][adapter];
        bytes32 storedHash = adapter.getHash(domain, id);

        if (storedHash == bytes32(0)) {
            // check block.timestamp is greater than challenge.timestamp + adapterSettings.timeout, revert if false.
            if (block.timestamp < challenge.timestamp + adapterSettings.timeout)
                revert AdapterHasNotYetTimedOut(adapter);
            adapterSettings.quarantined = true;
            // send bond to challenger
            challenge.challenger.transfer(challenge.bond);
            success = true;
        } else {
            // if _adapters + 1 equals threshold && _adapters + adapter report the same header
            if (_adapters.length + 1 == domains[domain].threshold) {
                bytes32 canonicalHash = hashi.getHash(domain, id, _adapters);
                if (canonicalHash == storedHash) {
                    // return bond to recipient
                    bondRecipient.transfer(challenge.bond);
                    success = false;
                } else {
                    revert IHashi.AdaptersDisagree(adapter, _adapters[0]);
                }
            } else {
                // check if _adapters report the same header as adapter
                bytes32 canonicalHash = getHash(domain, id, _adapters);
                if (canonicalHash == storedHash) {
                    bondRecipient.transfer(challenge.bond);
                    success = false;
                } else {
                    // quaratine adapter
                    adapterSettings.quarantined = true;
                    // return bond to challenger
                    challenge.challenger.transfer(challenge.bond);
                    success = true;
                }
            }
        }
        emit ChallengeResolved(challengeId, domain, id, adapter, challenge.challenger, challenge.bond, success);

        delete challenge.challenger;
        delete challenge.timestamp;
        delete challenge.bond;
    }

    /// @inheritdoc IGiriGiriBashi
    function setBondRecipient(address payable _bondRecipient) public onlyOwner {
        bondRecipient = _bondRecipient;
        emit BondRecipientSet(_bondRecipient);
    }

    /// @inheritdoc IGiriGiriBashi
    function setChallengeRange(uint256 domain, uint256 range) public onlyOwner {
        if (challengeRanges[domain] != 0) revert ChallengeRangeAlreadySet(domain);
        challengeRanges[domain] = range;
        emit ChallengeRangeUpdated(domain, range);
    }

    function setHashi(IHashi _hashi) public override onlyInitializing {
        _setHashi(_hashi);
    }

    /// @inheritdoc IGiriGiriBashi
    function setThreshold(uint256 domain, uint256 threshold) public zeroCount(domain) {
        _setThreshold(domain, threshold);
    }

    function initSettings(uint256 domain, IAdapter[] memory _adapters, Settings[] memory _settings) private {
        if (_adapters.length != _settings.length) revert UnequalArrayLengths();
        for (uint256 i = 0; i < _adapters.length; i++) {
            IAdapter adapter = _adapters[i];
            settings[domain][adapter].quarantined = false;
            settings[domain][adapter].minimumBond = _settings[i].minimumBond;
            settings[domain][adapter].startId = _settings[i].startId;
            settings[domain][adapter].idDepth = _settings[i].idDepth;
            settings[domain][adapter].timeout = _settings[i].timeout;
            emit SettingsInitialized(domain, adapter, _settings[i]);
        }
    }

    function updateHead(uint256 domain, uint256 id) private {
        if (id > heads[domain]) heads[domain] = id;
        emit NewHead(domain, id);
    }
}
