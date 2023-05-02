// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IAMB } from "./IAMB.sol";
import { OracleAdapter } from "../OracleAdapter.sol";
import { BlockHashOracleAdapter } from "../BlockHashOracleAdapter.sol";

contract AMBAdapter is OracleAdapter, BlockHashOracleAdapter {
    IAMB public amb;
    address public reporter;
    bytes32 public chainId;

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
    function storeHashes(uint256[] memory ids, bytes32[] memory _hashes) public onlyValid {
        if (ids.length != _hashes.length) revert ArrayLengthMissmatch(address(this));
        for (uint256 i = 0; i < ids.length; i++) {
            _storeHash(uint256(chainId), ids[i], _hashes[i]);
        }
    }
}
