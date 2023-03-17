// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "./IAMB.sol";
import "../IOracleAdapter.sol";

contract AMBAdapter {
    IAMB public amb;
    address public reporter;
    bytes32 public chainId;
    mapping(uint256 => bytes32) public hashes;

    event HashStored(uint256 indexed id, bytes32 indexed hashes);

    error ArrayLengthMissmatch(address emitter);
    error UnauthorizedAMB(address emitter, address sender);
    error UnauthorizedChainId(address emitter, bytes32 chainId);
    error UnauthorizedHashReporter(address emitter, address reporter);

    constructor(IAMB _amb, address _reporter, bytes32 _chainId) {
        amb = _amb;
        reporter = _reporter;
        chainId = _chainId;
    }

    /// @dev Check that the amb, chainId, and owner are valid.
    modifier onlyValid() {
        if (msg.sender != address(amb)) revert UnauthorizedAMB(address(this), msg.sender);
        if (amb.messageSourceChainId() != chainId) revert UnauthorizedChainId(address(this), chainId);
        if (amb.messageSender() != reporter) revert UnauthorizedHashReporter(address(this), reporter);
        _;
    }

    /// @dev Stores the hashes for a given array of idss.
    /// @param ids Array of ids number for which to set the hashes.
    /// @param _hashes Array of hashes to set for the given ids.
    /// @notice Only callable by `amb` with a message passed from `reporter.
    /// @notice Will revert if given array lengths do not match.
    function storeHashes(uint256[] memory ids, bytes32[] memory _hashes) public {
        if (ids.length != _hashes.length) revert ArrayLengthMissmatch(address(this));
        for (uint i = 0; i < ids.length; i++) {
            _storeHash(ids[i], _hashes[i]);
        }
    }

    function _storeHash(uint256 id, bytes32 hash) internal onlyValid {
        bytes32 currentHash = hashes[id];
        if (currentHash != hash) {
            hashes[id] = hash;
            emit HashStored(id, hash);
        }
    }

    /// @dev Returns the hash for a given ID, as reported by the AMB.
    /// @param id Identifier for the ID to query.
    /// @return hash Bytes32 hash reported by the oracle for the given ID on the given domain.
    /// @notice MUST return bytes32(0) if the oracle has not yet reported a hash for the given ID.
    function getHashFromOracle(uint256, uint256 id) external view returns (bytes32 hash) {
        hash = hashes[id];
    }
}
