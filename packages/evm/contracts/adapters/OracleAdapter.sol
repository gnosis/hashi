// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IOracleAdapter } from "../interfaces/IOracleAdapter.sol";
import { MessageHashCalculator } from "../utils/MessageHashCalculator.sol";
import { MessageIdCalculator } from "../utils/MessageIdCalculator.sol";
import { OracleAdapter } from "./OracleAdapter.sol";

abstract contract OracleAdapter is IOracleAdapter, MessageHashCalculator, MessageIdCalculator {
    bytes32 public immutable MESSAGE_BHR = keccak256("MESSAGE_BHR");

    mapping(uint256 => mapping(bytes32 => bytes32)) public hashes;

    /// @dev Returns the hash for a given domain and ID, as reported by the oracle.
    /// @param domain Identifier for the domain to query.
    /// @param id Identifier for the ID to query.
    /// @return hash Bytes32 hash reported by the oracle for the given ID on the given domain.
    /// @notice MUST return bytes32(0) if the oracle has not yet reported a hash for the given ID.
    function getHashFromOracle(uint256 domain, bytes32 id) external view returns (bytes32 hash) {
        hash = hashes[domain][id];
    }

    /// @dev Stores a hash for a given domain and ID.
    /// @param domain Identifier for the domain.
    /// @param id Identifier for the ID of the hash.
    /// @param hash Bytes32 hash value to store.
    function _storeHash(uint256 domain, bytes32 id, bytes32 hash) internal {
        bytes32 currentHash = hashes[domain][id];
        if (currentHash != hash) {
            hashes[domain][id] = hash;
            emit HashStored(id, hash);
        }
    }
}
