// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { IHashi } from "./IHashi.sol";
import { IOracleAdapter } from "./IOracleAdapter.sol";
import { IShuSho } from "./IShuSho.sol";

/**
 * @title IGiriGiriBashi
 */
interface IGiriGiriBashi is IShuSho {
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

    event BondRecipientSet(address payable bondRecipient);
    event NewHead(uint256 domain, uint256 head);
    event ChallegenRangeUpdated(uint256 domain, uint256 range);
    event SettingsInitialized(uint256 domain, IOracleAdapter adapter, Settings settings);
    event ChallengeCreated(
        bytes32 challengeId,
        uint256 indexed domain,
        uint256 id,
        IOracleAdapter indexed adapter,
        address indexed challenger,
        uint256 timestamp,
        uint256 bond
    );
    event ChallengeResolved(
        bytes32 challengeId,
        uint256 indexed domain,
        uint256 id,
        IOracleAdapter indexed adapter,
        address indexed challenger,
        uint256 bond,
        bool challengeSuccessful
    );
    event NoConfidenceDeclareed(uint256 domain);

    error DuplicateChallenge(bytes32 challengeId, uint256 domain, uint256 id, IOracleAdapter adapter);
    error OutOfRange(IOracleAdapter adapter, uint256 id);
    error AlreadyQuarantined(IOracleAdapter adapter);
    error NotEnoughtValue(IOracleAdapter adapter, uint256 value);
    error ChallengeNotFound(bytes32 challengeId, uint256 domain, uint256 id, IOracleAdapter adapter);
    error AdapterHasNotYetTimedOut(IOracleAdapter adapter);
    error UnequalArrayLengths();
    error AdapterNotQuarantined(IOracleAdapter adapter);
    error CannotProveNoConfidence(uint256 domain, uint256 id, IOracleAdapter[] adapters);
    error AdaptersAgreed(IOracleAdapter, IOracleAdapter);
    error NoConfidenceRequired();
    error CountMustBeZero(uint256 domain);
    error ChallengeRangeAlreadySet(uint256 domain);

    /**
     * @dev Sets the threshold for a specific domain.
     * @param domain - The Uint256 identifier for the domain.
     * @param threshold - The Uint256 threshold to set for the given domain.
     */
    function setThreshold(uint256 domain, uint256 threshold) external;

    /**
     * @dev Sets the bond recipient address for payments.
     * @param bondRecipient - The address where bond payments should be sent.
     */
    function setBondRecipient(address payable bondRecipient) external;

    /**
     * @dev Sets the challenge range for a specific domain.
     * @param domain - The Uint256 identifier for the domain.
     * @param range - The Uint256 range to set for the given domain.
     */
    function setChallengeRange(uint256 domain, uint256 range) external;

    /**
     * @dev Challenges the oracle adapter to provide a response. If the oracle adapter fails, it can be quarantined.
     * @param domain - The Uint256 identifier for the domain.
     * @param  id - The Uint256 identifier for the challenge.
     * @param adapter - The address of the oracle adapter to challenge.
     * @notice Caller must pay a minimum bond to issue the challenge. This bond should be high enough to cover the gas costs for successfully completing the challenge.
     */
    function challengeOracleAdapter(uint256 domain, uint256 id, IOracleAdapter adapter) external payable;

    /**
     * @dev Resolves a challenge by comparing results from a specific oracle adapter with others.
     * @param domain - The Uint256 identifier for the domain.
     * @param id - The Uint256 identifier.
     * @param adapter - The oracle adapter instance for comparison.
     * @param adapters - An array of oracle adapter instances for comparison.
     * @return A boolean indicating the success of the challenge resolution.
     */
    function resolveChallenge(
        uint256 domain,
        uint256 id,
        IOracleAdapter adapter,
        IOracleAdapter[] memory adapters
    ) external returns (bool);

    /**
     * @dev show that enough oracles disagree that they could not make a threshold if the remainder all agree with one.
     * @param domain - The Uint256 identifier for the domain.
     * @param id - The Uint256 identifier.
     * @param adapters - An array of oracle adapter instances.
     */
    function declareNoConfidence(uint256 domain, uint256 id, IOracleAdapter[] memory adapters) external;

    /**
     * @dev Replaces the quarantined oracle adapters for a given domain with new adapters and settings.
     * @param domain - The Uint256 identifier for the domain.
     * @param currentAdapters - An array of current oracle adapter instances to be replaced.
     * @param newAdapters - An array of new oracle adapter instances to replace the current ones.
     * @param settings - An array of settings corresponding to the new adapters.
     */
    function replaceQuaratinedOrcales(
        uint256 domain,
        IOracleAdapter[] memory currentAdapters,
        IOracleAdapter[] memory newAdapters,
        Settings[] memory settings
    ) external;

    /**
     * @dev Disables a set of oracle adapters for a given domain.
     * @param domain - The Uint256 identifier for the domain.
     * @param adapters - An array of oracle adapter instances to be disabled.
     */
    function disableOracleAdapters(uint256 domain, IOracleAdapter[] memory adapters) external;

    /**
     * @dev Enables a set of oracle adapters for a given domain with specific settings.
     * @param domain - The Uint256 identifier for the domain.
     * @param adapters - An array of oracle adapter instances.
     * @param settings - An array of settings, corresponding to each adapter.
     */
    function enableOracleAdapters(
        uint256 domain,
        IOracleAdapter[] memory adapters,
        Settings[] memory settings
    ) external;

    /**
     * @dev Gets the challenge ID for a given domain, ID, and oracle adapter.
     * @param domain - The Uint256 identifier for the domain.
     * @param id - The Uint256 identifier.
     * @param adapter - The oracle adapter instance.
     * @return The computed challenge ID as a bytes32 hash.
     */
    function getChallengeId(uint256 domain, uint256 id, IOracleAdapter adapter) external pure returns (bytes32);

    /**
     * @dev Returns the hash unanimously agreed upon by ALL of the enabled oraclesAdapters.
     * @param domain - Uint256 identifier for the domain to query.
     * @param id - Uint256 identifier to query.
     * @return hash - Bytes32 hash agreed upon by the oracles for the given domain.
     * @notice Reverts if oracles disagree.
     * @notice Reverts if oracles have not yet reported the hash for the given ID.
     * @notice Reverts if no oracles are set for the given domain.
     */
    function getUnanimousHash(uint256 domain, uint256 id) external returns (bytes32 hash);

    /**
     * @dev Returns the hash agreed upon by a threshold of the enabled oraclesAdapters.
     * @param domain - Uint256 identifier for the domain to query.
     * @param id - Uint256 identifier to query.
     * @return hash - Bytes32 hash agreed upon by a threshold of the oracles for the given domain.
     * @notice Reverts if no threshold is not reached.
     * @notice Reverts if no oracles are set for the given domain.
     */
    function getThresholdHash(uint256 domain, uint256 id) external returns (bytes32 hash);

    /**
     * @dev Returns the hash unanimously agreed upon by all of the given oraclesAdapters.
     * @param domain - Uint256 identifier for the domain to query.
     * @param adapters - Array of oracle adapter addresses to query.
     * @param id - Uint256 identifier to query.
     * @return hash - Bytes32 hash agreed upon by the oracles for the given domain.
     * @notice adapters must be in numerical order from smallest to largest and contain no duplicates.
     * @notice Reverts if adapters are out of order or contain duplicates.
     * @notice Reverts if oracles disagree.
     * @notice Reverts if oracles have not yet reported the hash for the given ID.
     * @notice Reverts if no oracles are set for the given domain.
     */
    function getHash(uint256 domain, uint256 id, IOracleAdapter[] memory adapters) external returns (bytes32 hash);
}
