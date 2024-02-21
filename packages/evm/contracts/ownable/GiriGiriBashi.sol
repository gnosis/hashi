// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { ShuSo } from "./ShuSo.sol";
import { IAdapter } from "../interfaces/IAdapter.sol";
import { IHashi } from "../interfaces/IHashi.sol";
import { IGiriGiriBashi } from "../interfaces/IGiriGiriBashi.sol";

contract GiriGiriBashi is IGiriGiriBashi, ShuSo {
    address payable public bondRecipient;

    mapping(uint256 => uint256) private _heads;
    mapping(uint256 => uint256) private _challengeRanges;
    mapping(uint256 => mapping(IAdapter => Settings)) private _settings;
    mapping(bytes32 => Challenge) private _challenges;

    constructor(address _owner, address _hashi, address payable _bondRecipient) ShuSo(_owner, _hashi) {
        bondRecipient = _bondRecipient;
    }

    modifier noConfidence(uint256 domain) {
        if (getDomain(domain).threshold != type(uint256).max) revert NoConfidenceRequired();
        _;
    }

    modifier zeroCount(uint256 domain) {
        Domain memory domainConfigs = getDomain(domain);
        if (domainConfigs.count != 0 && domainConfigs.threshold > 0) revert CountMustBeZero(domain);
        _;
    }

    /// @inheritdoc IGiriGiriBashi
    function challengeAdapter(uint256 domain, uint256 id, IAdapter adapter) public payable {
        if (getAdapterLink(domain, adapter).previous == IAdapter(address(0))) revert AdapterNotEnabled(adapter);
        if (msg.value < _settings[domain][adapter].minimumBond) revert NotEnoughValue(adapter, msg.value);
        if (_settings[domain][adapter].quarantined) revert AlreadyQuarantined(adapter);

        bytes32 challengeId = getChallengeId(domain, id, adapter);
        if (_challenges[challengeId].challenger != address(0))
            revert DuplicateChallenge(challengeId, domain, id, adapter);

        // check if id is lower than startId, revert if true.
        // check if id is less than highestId + challengeRange, revert if false
        // check if id is lower than highestId - idDepth, revert if true
        uint256 challengeRange = _challengeRanges[domain];
        uint256 idDepth = _settings[domain][adapter].idDepth;
        uint256 head = _heads[domain];
        if (
            id < _settings[domain][adapter].startId || // before start id
            (challengeRange != 0 && id >= head && id - head > challengeRange) || // over domain challenge range
            (idDepth != 0 && head > idDepth && id <= head - idDepth) // outside of adapter idDepth
        ) revert OutOfRange(adapter, id);

        Challenge storage challenge = _challenges[challengeId];
        challenge.challenger = payable(msg.sender);
        challenge.timestamp = block.timestamp;
        challenge.bond = msg.value;

        emit ChallengeCreated(challengeId, domain, id, adapter, msg.sender, block.timestamp, msg.value);
    }

    /// @inheritdoc IGiriGiriBashi
    function enableAdapters(
        uint256 domain,
        IAdapter[] memory adapters,
        Settings[] memory settings
    ) public zeroCount(domain) {
        _enableAdapters(domain, adapters);
        initSettings(domain, adapters, settings);
    }

    /// @inheritdoc IGiriGiriBashi
    function declareNoConfidence(uint256 domain, uint256 id, IAdapter[] memory adapters) public {
        checkAdapterOrderAndValidity(domain, adapters);
        (uint256 threshold, uint256 count) = getThresholdAndCount(domain);

        if (adapters.length != count) revert CannotProveNoConfidence(domain, id, adapters);

        bytes32[] memory hashes = new bytes32[](adapters.length);
        uint256 zeroHashes = 0;
        for (uint256 i = 0; i < adapters.length; i++) {
            hashes[i] = adapters[i].getHash(domain, id);
            if (hashes[i] == bytes32(0)) zeroHashes++;
            if (zeroHashes == threshold) revert CannotProveNoConfidence(domain, id, adapters);
        }

        for (uint256 i = 0; i < hashes.length; i++) {
            uint256 equalHashes = 1;
            for (uint256 j = 0; j < hashes.length; j++)
                if (hashes[i] == hashes[j] && i != j) {
                    equalHashes++;
                    if (equalHashes == threshold) {
                        revert AdaptersAgreed();
                    }
                }
        }

        _setDomainThreshold(domain, type(uint256).max);
        delete _challengeRanges[domain];

        emit NoConfidenceDeclared(domain);
    }

    /// @inheritdoc IGiriGiriBashi
    function disableAdapters(uint256 domain, IAdapter[] memory adapters) public noConfidence(domain) {
        _disableAdapters(domain, adapters);
        if (getDomain(domain).count == 0) _setDomainThreshold(domain, 0);
    }

    /// @inheritdoc IGiriGiriBashi
    function getSettings(uint256 domain, IAdapter adapter) external view returns (Settings memory) {
        return _settings[domain][adapter];
    }

    /// @inheritdoc IGiriGiriBashi
    function getChallenge(bytes32 challengeId) external view returns (Challenge memory) {
        return _challenges[challengeId];
    }

    /// @inheritdoc IGiriGiriBashi
    function getChallengeId(uint256 domain, uint256 id, IAdapter adapter) public pure returns (bytes32 challengeId) {
        challengeId = keccak256(abi.encodePacked(domain, id, adapter));
    }

    /// @inheritdoc IGiriGiriBashi
    function getChallengeRange(uint256 domain) external view returns (uint256) {
        return _challengeRanges[domain];
    }

    /// @inheritdoc IGiriGiriBashi
    function getHead(uint256 domain) external view returns (uint256) {
        return _heads[domain];
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
    function getHash(uint256 domain, uint256 id, IAdapter[] memory adapters) public returns (bytes32 hash) {
        hash = _getHash(domain, id, adapters);
        updateHead(domain, id);
    }

    /// @inheritdoc IGiriGiriBashi
    function replaceQuarantinedAdapters(
        uint256 domain,
        IAdapter[] memory currentAdapters,
        IAdapter[] memory newAdapters,
        Settings[] memory settings
    ) public onlyOwner {
        if (currentAdapters.length != newAdapters.length || currentAdapters.length != settings.length)
            revert UnequalArrayLengths();
        for (uint256 i = 0; i < currentAdapters.length; i++) {
            if (!_settings[domain][currentAdapters[i]].quarantined) revert AdapterNotQuarantined(currentAdapters[i]);
        }
        _disableAdapters(domain, currentAdapters);
        _enableAdapters(domain, newAdapters);
        initSettings(domain, newAdapters, settings);
    }

    /// @inheritdoc IGiriGiriBashi
    function resolveChallenge(
        uint256 domain,
        uint256 id,
        IAdapter adapter,
        IAdapter[] memory adapters
    ) public returns (bool success) {
        // check if challenge exists, revert if false
        bytes32 challengeId = getChallengeId(domain, id, adapter);
        if (_challenges[challengeId].challenger == address(0))
            revert ChallengeNotFound(challengeId, domain, id, adapter);

        for (uint256 i = 0; i < adapters.length; ) {
            if (adapters[i] == adapter) revert AdaptersCannotContainChallengedAdapter(adapters, adapter);
            unchecked {
                ++i;
            }
        }

        Challenge storage challenge = _challenges[challengeId];
        Settings storage adapterSettings = _settings[domain][adapter];
        bytes32 storedHash = adapter.getHash(domain, id);

        if (storedHash == bytes32(0)) {
            if (block.timestamp < challenge.timestamp + adapterSettings.timeout)
                revert AdapterHasNotYetTimedOut(adapter);
            adapterSettings.quarantined = true;
            challenge.challenger.transfer(challenge.bond);
            success = true;
        } else {
            // if adapters + 1 equals threshold && adapters + adapter report the same header
            if (adapters.length == getDomain(domain).threshold - 1) {
                checkAdapterOrderAndValidity(domain, adapters);
                bytes32 canonicalHash = hashi.getHash(domain, id, adapters);
                if (canonicalHash == storedHash) {
                    bondRecipient.transfer(challenge.bond);
                    success = false;
                } else {
                    revert IHashi.AdaptersDisagree(adapter, adapters[0]);
                }
            } else {
                // check if adapters report the same header as adapter
                bytes32 canonicalHash = getHash(domain, id, adapters);
                if (canonicalHash == storedHash) {
                    bondRecipient.transfer(challenge.bond);
                    success = false;
                } else {
                    adapterSettings.quarantined = true;
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
        if (_challengeRanges[domain] != 0) revert ChallengeRangeAlreadySet(domain);
        _challengeRanges[domain] = range;
        emit ChallengeRangeUpdated(domain, range);
    }

    function setHashi(IHashi _hashi) public override onlyInitializing {
        _setHashi(_hashi);
    }

    /// @inheritdoc IGiriGiriBashi
    function setThreshold(uint256 domain, uint256 threshold) public zeroCount(domain) {
        _setThreshold(domain, threshold);
    }

    function initSettings(uint256 domain, IAdapter[] memory _adapters, Settings[] memory adapters) private {
        if (_adapters.length != adapters.length) revert UnequalArrayLengths();
        for (uint256 i = 0; i < _adapters.length; i++) {
            IAdapter adapter = _adapters[i];
            _settings[domain][adapter].quarantined = false;
            _settings[domain][adapter].minimumBond = adapters[i].minimumBond;
            _settings[domain][adapter].startId = adapters[i].startId;
            _settings[domain][adapter].idDepth = adapters[i].idDepth;
            _settings[domain][adapter].timeout = adapters[i].timeout;
            emit SettingsInitialized(domain, adapter, adapters[i]);
        }
    }

    function updateHead(uint256 domain, uint256 id) private {
        if (id > _heads[domain]) _heads[domain] = id;
        emit NewHead(domain, id);
    }
}
