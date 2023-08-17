// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IOracleAdapter, ShuSo, Hashi } from "./ShuSo.sol";

struct Settings {
    bool quarantined; // whether or not the adapter has has been quarantined.
    uint256 minimumBond; // amount that must be bonded alongside a challenge.
    uint256 startId; // earliest id that the oracle could have reported.
    uint256 idDepth; // how far behind the current head can this oracle safely report. 0 equals infinite.
    uint256 timeout; // grace period in which the oracle must report on an in range id after being challenged.
}

struct Challenge {
    address payable challenger; // account that raised the challenge.
    uint256 timestamp; // timestamp when the challenge was created.
    uint256 bond; // bond paid by the challenger.
}

contract GiriGiriBashi is ShuSo {
    address payable public bondRecipient; // address that bonds from unsuccessful challenges should be sent to.

    mapping(uint256 => uint256) public heads; // highest Id reported.
    mapping(uint256 => uint256) public challengeRanges; // how far beyond the current highestId can a challenged.
    mapping(IOracleAdapter => Settings) public settings;
    mapping(bytes32 => Challenge) public challenges; // current challenges.

    event BondRecipientSet(address emitter, address payable bondRecipient);
    event NewHead(address emitter, uint256 domain, uint256 head);
    event ChallegenRangeUpdated(address emitter, uint256 domain, uint256 range);
    event SettingsInitialized(address emitter, uint256 domain, IOracleAdapter adapter, Settings settings);
    event ChallengeCreated(
        address emitter,
        bytes32 challengeId,
        uint256 indexed domain,
        uint256 id,
        IOracleAdapter indexed adapter,
        address indexed challenger,
        uint256 timestamp,
        uint256 bond
    );
    event ChallengeResolved(
        address emitter,
        bytes32 challengeId,
        uint256 indexed domain,
        uint256 id,
        IOracleAdapter indexed adapter,
        address indexed challenger,
        uint256 bond,
        bool challengeSuccessful
    );
    event NoConfidenceDeclareed(address emitter, uint256 domain);

    error DuplicateChallenge(address emitter, bytes32 challengeId, uint256 domain, uint256 id, IOracleAdapter adapter);
    error OutOfRange(address emitter, IOracleAdapter adapter, uint256 id);
    error AlreadyQuarantined(address emitter, IOracleAdapter adapter);
    error NotEnoughtValue(address emitter, IOracleAdapter adapter, uint256 value);
    error ChallengeNotFound(address emitter, bytes32 challengeId, uint256 domain, uint256 id, IOracleAdapter adapter);
    error AdapterHasNotYetTimedOut(address emitter, IOracleAdapter adapter);
    error UnequalArrayLengths(address emitter);
    error AdapterNotQuarantined(address emitter, IOracleAdapter adapter);
    error CannotProveNoConfidence(address emitter, uint256 domain, uint256 id, IOracleAdapter[] adapters);
    error AdaptersAgreed(address emitter, IOracleAdapter, IOracleAdapter);
    error NoConfidenceRequired(address emitter);
    error CountMustBeZero(address emitter, uint256 domain);
    error ChallengeRangeAlreadySet(address emitter, uint256 domain);

    constructor(address _owner, address _hashi, address payable _bondRecipient) ShuSo(_owner, _hashi) {
        bondRecipient = _bondRecipient;
    }

    modifier noConfidence(uint256 domain) {
        if (domains[domain].threshold != type(uint256).max) revert NoConfidenceRequired(address(this));
        _;
    }

    modifier zeroCount(uint256 domain) {
        if (domains[domain].count != 0) revert CountMustBeZero(address(this), domain);
        _;
    }

    function setHashi(Hashi _hashi) public override onlyInitializing {
        _setHashi(_hashi);
    }

    function setThreshold(uint256 domain, uint256 threshold) public zeroCount(domain) {
        _setThreshold(domain, threshold);
    }

    function setBondRecipient(address payable _bondRecipient) public onlyOwner {
        bondRecipient = _bondRecipient;
        emit BondRecipientSet(address(this), _bondRecipient);
    }

    function setChallengeRange(uint256 domain, uint256 range) public {
        if (challengeRanges[domain] != 0) revert ChallengeRangeAlreadySet(address(this), domain);
        challengeRanges[domain] = range;
        emit ChallegenRangeUpdated(address(this), domain, range);
    }

    /// @dev Challenges the oracle adapter to provide a response.
    /// If the oracle adapter fails, it can be quarantined.
    /// @param domain Uint256 identifier for the domain for which to set the threshold.
    /// @param id Uint256 threshold to set for the given domain.
    /// @param adapter Address of the oracle adapter to challenge.
    /// @notice Caller must pay a minimum bond to issue the challenge.
    /// This bond should be high enough to cover the gas costs for successfully completing the challenge.
    function challengeOracleAdapter(uint256 domain, uint256 id, IOracleAdapter adapter) public payable {
        // check if oracle is enabled, revert if false
        if (adapters[domain][adapter].previous == IOracleAdapter(address(0)))
            revert AdapterNotEnabled(address(this), adapter);

        // check that msg.value is => greater than minimum bond for oracle, revert if false
        if (msg.value < settings[adapter].minimumBond) revert NotEnoughtValue(address(this), adapter, msg.value);

        // check if oracle is quarantined, revert if true
        if (settings[adapter].quarantined) revert AlreadyQuarantined(address(this), adapter);

        // check if challenge already exists, revert if true
        bytes32 challengeId = getChallengeId(domain, id, adapter);
        if (challenges[challengeId].challenger != address(0))
            revert DuplicateChallenge(address(this), challengeId, domain, id, adapter);

        // check if id is lower than startId, revert if true.
        // check if id is less than highestId + challengeRange, revert if false
        // check if id is lower than highestId - idDepth, revert if true
        uint256 challengeRange = challengeRanges[domain];
        uint256 idDepth = settings[adapter].idDepth;
        uint256 head = heads[domain];
        if (
            id < settings[adapter].startId || // before start id
            (challengeRange != 0 && id >= head && id - head > challengeRange) || // over domain challenge range
            (idDepth != 0 && head > idDepth && id <= head - idDepth) // outside of adapter idDepth
        ) revert OutOfRange(address(this), adapter, id);

        // create challenge
        Challenge storage challenge = challenges[challengeId];
        challenge.challenger = payable(msg.sender);
        challenge.timestamp = block.timestamp;
        challenge.bond = msg.value;

        // emit OracleAdapterChallenged
        emit ChallengeCreated(address(this), challengeId, domain, id, adapter, msg.sender, block.timestamp, msg.value);
    }

    function resolveChallenge(
        uint256 domain,
        uint256 id,
        IOracleAdapter adapter,
        IOracleAdapter[] memory _adapters
    ) public returns (bool success) {
        // check if challenge exists, revert if false
        bytes32 challengeId = getChallengeId(domain, id, adapter);
        if (challenges[challengeId].challenger == address(0))
            revert ChallengeNotFound(address(this), challengeId, domain, id, adapter);

        // check if oracle has reported
        Challenge storage challenge = challenges[challengeId];
        Settings storage adapterSettings = settings[adapter];
        bytes32 reportedHash = adapter.getHashFromOracle(domain, id);

        // if no hash reported
        if (reportedHash == bytes32(0)) {
            // check block.timestamp is greater than challenge.timestamp + adapterSettings.timeout, revert if false.
            if (block.timestamp < challenge.timestamp + adapterSettings.timeout)
                revert AdapterHasNotYetTimedOut(address(this), adapter);
            // quaratine oracle adapter.
            adapterSettings.quarantined = true;
            // send bond to challenger
            challenge.challenger.transfer(challenge.bond);
            success = true;
        } else {
            // if _adapters + 1 equals threshold && _adapters + adapter report the same header
            if (_adapters.length + 1 == domains[domain].threshold) {
                bytes32 canonicalHash = hashi.getHash(domain, id, _adapters);
                if (canonicalHash == reportedHash) {
                    // return bond to recipient
                    bondRecipient.transfer(challenge.bond);
                    success = false;
                } else {
                    revert Hashi.OraclesDisagree(address(this), adapter, _adapters[0]);
                }
            } else {
                // check if _adapters report the same header as adapter
                bytes32 canonicalHash = getHash(domain, id, _adapters);
                if (canonicalHash == reportedHash) {
                    // if reported headers match send bond to recipient.
                    bondRecipient.transfer(challenge.bond);
                    success = false;
                } else {
                    // quaratine oracle
                    adapterSettings.quarantined = true;
                    // return bond to challenger
                    challenge.challenger.transfer(challenge.bond);
                    success = true;
                }
            }
        }
        emit ChallengeResolved(
            address(this),
            challengeId,
            domain,
            id,
            adapter,
            challenge.challenger,
            challenge.bond,
            success
        );
        // delete challenge
        delete challenge.challenger;
        delete challenge.timestamp;
        delete challenge.bond;
    }

    // show that enough oracles disagree that they could not make a threshold if the remainder all agree with one.
    function declareNoConfidence(uint256 domain, uint256 id, IOracleAdapter[] memory _adapters) public {
        checkAdapterOrderAndValidity(domain, _adapters);
        (uint256 threshold, uint256 count) = getThresholdAndCount(domain);

        // check that there are enough adapters to prove no confidence
        uint256 confidence = (count - _adapters.length) + 1;
        if (confidence >= threshold) revert CannotProveNoConfidence(address(this), domain, id, _adapters);

        // get hashes
        bytes32[] memory hashes = new bytes32[](_adapters.length);
        for (uint i = 0; i < _adapters.length; i++) hashes[i] = _adapters[i].getHashFromOracle(domain, id);

        // prove that each member of _adapters disagrees
        for (uint i = 0; i < hashes.length; i++)
            for (uint j = 0; j < hashes.length; j++)
                if (hashes[i] == hashes[j] && i != j) revert AdaptersAgreed(address(this), _adapters[i], _adapters[j]);

        // set no confidence
        domains[domain].threshold = type(uint256).max;

        // clear state
        delete challengeRanges[domain];

        emit NoConfidenceDeclareed(address(this), domain);
    }

    function initSettings(uint256 domain, IOracleAdapter[] memory _adapters, Settings[] memory _settings) private {
        if (_adapters.length != _settings.length) revert UnequalArrayLengths(address(this));
        for (uint i = 0; i < _adapters.length; i++) {
            IOracleAdapter adapter = _adapters[i];
            settings[adapter].quarantined = false;
            settings[adapter].minimumBond = _settings[i].minimumBond;
            settings[adapter].startId = _settings[i].startId;
            settings[adapter].idDepth = _settings[i].idDepth;
            settings[adapter].timeout = _settings[i].timeout;
            emit SettingsInitialized(address(this), domain, adapter, _settings[i]);
        }
    }

    function replaceQuaratinedOrcales(
        uint256 domain,
        IOracleAdapter[] memory currentAdapters,
        IOracleAdapter[] memory newAdapters,
        Settings[] memory _settings
    ) public onlyOwner {
        if (currentAdapters.length != newAdapters.length || currentAdapters.length != _settings.length)
            revert UnequalArrayLengths(address(this));
        for (uint i = 0; i < currentAdapters.length; i++) {
            if (!settings[currentAdapters[i]].quarantined)
                revert AdapterNotQuarantined(address(this), currentAdapters[i]);
        }
        _disableOracleAdapters(domain, currentAdapters);
        _enableOracleAdapters(domain, newAdapters);
        initSettings(domain, newAdapters, _settings);
    }

    function disableOracleAdapters(uint256 domain, IOracleAdapter[] memory _adapters) public noConfidence(domain) {
        _disableOracleAdapters(domain, _adapters);
        if (domains[domain].count == 0) domains[domain].threshold = 0;
    }

    function enableOracleAdapters(
        uint256 domain,
        IOracleAdapter[] memory _adapters,
        Settings[] memory _settings
    ) public zeroCount(domain) {
        _enableOracleAdapters(domain, _adapters);
        initSettings(domain, _adapters, _settings);
    }

    function updateHead(uint256 domain, uint256 id) private {
        if (id > heads[domain]) heads[domain] = id;
        emit NewHead(address(this), domain, id);
    }

    function getChallengeId(
        uint256 domain,
        uint256 id,
        IOracleAdapter adapter
    ) public pure returns (bytes32 challengeId) {
        challengeId = keccak256(abi.encodePacked(domain, id, adapter));
    }

    /// @dev Returns the hash unanimously agreed upon by ALL of the enabled oraclesAdapters.
    /// @param domain Uint256 identifier for the domain to query.
    /// @param id Uint256 identifier to query.
    /// @return hash Bytes32 hash agreed upon by the oracles for the given domain.
    /// @notice Reverts if oracles disagree.
    /// @notice Reverts if oracles have not yet reported the hash for the given ID.
    /// @notice Reverts if no oracles are set for the given domain.
    function getUnanimousHash(uint256 domain, uint256 id) public returns (bytes32 hash) {
        hash = _getUnanimousHash(domain, id);
        updateHead(domain, id);
    }

    /// @dev Returns the hash agreed upon by a threshold of the enabled oraclesAdapters.
    /// @param domain Uint256 identifier for the domain to query.
    /// @param id Uint256 identifier to query.
    /// @return hash Bytes32 hash agreed upon by a threshold of the oracles for the given domain.
    /// @notice Reverts if no threshold is not reached.
    /// @notice Reverts if no oracles are set for the given domain.
    function getThresholdHash(uint256 domain, uint256 id) public returns (bytes32 hash) {
        hash = _getThresholdHash(domain, id);
        updateHead(domain, id);
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
    function getHash(uint256 domain, uint256 id, IOracleAdapter[] memory _adapters) public returns (bytes32 hash) {
        hash = _getHash(domain, id, _adapters);
        updateHead(domain, id);
    }
}
