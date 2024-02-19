// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { IAdapter } from "./IAdapter.sol";
import { IHashi } from "./IHashi.sol";
import { IShuSho } from "./IShuSho.sol";

/**
 * @title IGiriGiriBashi
 */
interface IGiriGiriBashi is IShuSho {
    struct Challenge {
        address payable challenger; // account that raised the challenge.
        uint256 timestamp; // timestamp when the challenge was created.
        uint256 bond; // bond paid by the challenger.
    }

    struct Settings {
        bool quarantined; // whether or not the adapter has been quarantined.
        uint256 minimumBond; // amount that must be bonded alongside a challenge.
        uint256 startId; // earliest id that the adapter could have stored.
        uint256 idDepth; // how far behind the current head can this adapter safely report. 0 equals infinite.
        uint256 timeout; // grace period in which the adapter must report on an in-range id after being challenged.
    }

    error AdaptersCannotContainChallengedAdapter(IAdapter[] adapters, IAdapter adapter);
    error AdapterHasNotYetTimedOut(IAdapter adapter);
    error AdapterNotQuarantined(IAdapter adapter);
    error AdaptersAgreed(IAdapter adapter1, IAdapter adapter2);
    error AlreadyQuarantined(IAdapter adapter);
    error CannotProveNoConfidence(uint256 domain, uint256 id, IAdapter[] adapters);
    error ChallengeNotFound(bytes32 challengeId, uint256 domain, uint256 id, IAdapter adapter);
    error ChallengeRangeAlreadySet(uint256 domain);
    error CountMustBeZero(uint256 domain);
    error DuplicateChallenge(bytes32 challengeId, uint256 domain, uint256 id, IAdapter adapter);
    error NoConfidenceRequired();
    error NotEnoughValue(IAdapter adapter, uint256 value);
    error OutOfRange(IAdapter adapter, uint256 id);
    error UnequalArrayLengths();

    /**
     * @dev Emitted when the bond recipient address is set.
     * @param bondRecipient - The new bond recipient address as an Ethereum address.
     */
    event BondRecipientSet(address payable bondRecipient);

    /**
     * @dev Emitted when a challenge is created.
     * @param challengeId - The unique identifier for the challenge.
     * @param domain - The domain associated with the challenge.
     * @param id - The identifier associated with the challenge.
     * @param adapter - The adapter address associated with the challenge.
     * @param challenger - The address of the challenger.
     * @param timestamp - The timestamp when the challenge was created.
     * @param bond - The bond amount associated with the challenge.
     */
    event ChallengeCreated(
        bytes32 challengeId,
        uint256 indexed domain,
        uint256 id,
        IAdapter indexed adapter,
        address indexed challenger,
        uint256 timestamp,
        uint256 bond
    );

    /**
     * @dev Emitted when the challenge range is updated.
     * @param domain - The domain associated with the updated challenge range.
     * @param range - The new challenge range as a Uint256 identifier.
     */
    event ChallengeRangeUpdated(uint256 domain, uint256 range);

    /**
     * @dev Emitted when a challenge is resolved.
     * @param challengeId - The unique identifier for the resolved challenge.
     * @param domain - The domain associated with the resolved challenge.
     * @param id - The identifier associated with the resolved challenge.
     * @param adapter - The adapter address associated with the resolved challenge.
     * @param challenger - The address of the challenger.
     * @param bond - The bond amount associated with the resolved challenge.
     * @param challengeSuccessful - A boolean indicating whether the challenge was successful.
     */
    event ChallengeResolved(
        bytes32 challengeId,
        uint256 indexed domain,
        uint256 id,
        IAdapter indexed adapter,
        address indexed challenger,
        uint256 bond,
        bool challengeSuccessful
    );

    /**
     * @dev Emitted when a new head is updated.
     * @param domain - The domain associated with the new head.
     * @param head - The new head as a Uint256 identifier.
     */
    event NewHead(uint256 domain, uint256 head);

    /**
     * @dev Emitted when a declaration of no confidence is made for a specific domain.
     * @param domain - The domain associated with the declaration.
     */
    event NoConfidenceDeclared(uint256 domain);

    /**
     * @dev Emitted when settings are initialized for a specific domain and adapter.
     * @param domain - The domain associated with the initialized settings.
     * @param adapter - The adapter address associated with the initialized settings.
     * @param settings - The initialized settings object.
     */
    event SettingsInitialized(uint256 domain, IAdapter adapter, Settings settings);

    /**
     * @dev Challenges the adapter to provide a response. If the adapter fails, it can be quarantined.
     * @param domain - The Uint256 identifier for the domain.
     * @param id - The Uint256 identifier for the challenge.
     * @param adapter - The address of the adapter to challenge.
     * @notice Caller must pay a minimum bond to issue the challenge. This bond should be high enough to cover the gas costs for successfully completing the challenge.
     */
    function challengeAdapter(uint256 domain, uint256 id, IAdapter adapter) external payable;

    /**
     * @dev Show that enough adapters disagree that they could not make a threshold if the remainder all agree with one.
     * @param domain - The Uint256 identifier for the domain.
     * @param id - The Uint256 identifier.
     * @param adapters - An array of adapter instances.
     */
    function declareNoConfidence(uint256 domain, uint256 id, IAdapter[] memory adapters) external;

    /**
     * @dev Disables a set of adapters for a given domain.
     * @param domain - The Uint256 identifier for the domain.
     * @param adapters - An array of adapter instances to be disabled.
     */
    function disableAdapters(uint256 domain, IAdapter[] memory adapters) external;

    /**
     * @dev Enables a set of adapters for a given domain with specific settings.
     * @param domain - The Uint256 identifier for the domain.
     * @param adapters - An array of adapter instances.
     * @param settings - An array of settings, corresponding to each adapter.
     */
    function enableAdapters(uint256 domain, IAdapter[] memory adapters, Settings[] memory settings) external;

    /**
     * @dev Gets the challenge ID for a given domain, ID, and adapter.
     * @param domain - The Uint256 identifier for the domain.
     * @param id - The Uint256 identifier.
     * @param adapter - The adapter instance.
     * @return The computed challenge ID as a bytes32 hash.
     */
    function getChallengeId(uint256 domain, uint256 id, IAdapter adapter) external pure returns (bytes32);

    /**
     * @dev Returns the hash agreed upon by a threshold of the enabled adapters.
     * @param domain - Uint256 identifier for the domain to query.
     * @param id - Uint256 identifier to query.
     * @return hash - Bytes32 hash agreed upon by a threshold of the adapters for the given domain.
     * @notice Reverts if no threshold is not reached.
     * @notice Reverts if no adapters are set for the given domain.
     */
    function getThresholdHash(uint256 domain, uint256 id) external returns (bytes32);

    /**
     * @dev Returns the hash unanimously agreed upon by ALL of the enabled adapters.
     * @param domain - Uint256 identifier for the domain to query.
     * @param id - Uint256 identifier to query.
     * @return hash - Bytes32 hash agreed upon by the adapters for the given domain.
     * @notice Reverts if adapters disagree.
     * @notice Revert if the adapters do not yet have the hash for the given ID.
     * @notice Reverts if no adapters are set for the given domain.
     */
    function getUnanimousHash(uint256 domain, uint256 id) external returns (bytes32);

    /**
     * @dev Returns the hash unanimously agreed upon by all of the given adapters.
     * @param domain - Uint256 identifier for the domain to query.
     * @param adapters - Array of adapter addresses to query.
     * @param id - Uint256 identifier to query.
     * @return hash - Bytes32 hash agreed upon by the adapters for the given domain.
     * @notice Adapters must be in numerical order from smallest to largest and contain no duplicates.
     * @notice Reverts if adapters are out of order or contain duplicates.
     * @notice Reverts if adapters disagree.
     * @notice Revert if the adapters do not yet have the hash for the given ID.
     * @notice Reverts if no adapters are set for the given domain.
     */
    function getHash(uint256 domain, uint256 id, IAdapter[] memory adapters) external returns (bytes32);

    /**
     * @dev Replaces the quarantined adapters for a given domain with new adapters and settings.
     * @param domain - The Uint256 identifier for the domain.
     * @param currentAdapters - An array of current adapter instances to be replaced.
     * @param newAdapters - An array of new adapter instances to replace the current ones.
     * @param settings - An array of settings corresponding to the new adapters.
     */
    function replaceQuarantinedAdapters(
        uint256 domain,
        IAdapter[] memory currentAdapters,
        IAdapter[] memory newAdapters,
        Settings[] memory settings
    ) external;

    /**
     * @dev Resolves a challenge by comparing results from a specific adapter with others.
     * @param domain - The Uint256 identifier for the domain.
     * @param id - The Uint256 identifier.
     * @param adapter - The adapter instance for comparison.
     * @param adapters - An array of adapter instances for comparison.
     * @return A boolean indicating the success of the challenge resolution.
     */
    function resolveChallenge(
        uint256 domain,
        uint256 id,
        IAdapter adapter,
        IAdapter[] memory adapters
    ) external returns (bool);

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
     * @dev Sets the threshold for a specific domain.
     * @param domain - The Uint256 identifier for the domain.
     * @param threshold - The Uint256 threshold to set for the given domain.
     */
    function setThreshold(uint256 domain, uint256 threshold) external;
}
