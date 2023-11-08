// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IAMB } from "./IAMB.sol";
import { OracleAdapter } from "../OracleAdapter.sol";

contract AMBAdapter is OracleAdapter {
    IAMB public amb;
    address public messageRelay;
    bytes32 public chainId;

    error ArrayLengthMissmatch(address emitter);
    error UnauthorizedAMB(address emitter, address sender);
    error UnauthorizedChainId(address emitter, bytes32 chainId);
    error UnauthorizedMessageRelay(address emitter, address messageRelay);

    constructor(IAMB _amb, address _messageRelay, bytes32 _chainId) {
        amb = _amb;
        messageRelay = _messageRelay;
        chainId = _chainId;
    }

    /// @dev Check that the amb, chainId, and owner are valid.
    modifier onlyValid() {
        if (msg.sender != address(amb)) revert UnauthorizedAMB(address(this), msg.sender);
        if (amb.messageSourceChainId() != chainId) revert UnauthorizedChainId(address(this), chainId);
        if (amb.messageSender() != messageRelay) revert UnauthorizedMessageRelay(address(this), messageRelay);
        _;
    }

    /// @dev Stores the hashes for a given array of idss.
    /// @param ids Array of ids for which to set the hashes.
    /// @param _hashes Array of hashes to set for the given ids.
    /// @notice Only callable by `amb` with a message passed from `messageRelay.
    /// @notice Will revert if given array lengths do not match.
    function storeHashes(bytes32[] memory ids, bytes32[] memory _hashes) public onlyValid {
        if (ids.length != _hashes.length) revert ArrayLengthMissmatch(address(this));
        for (uint256 i = 0; i < ids.length; i++) {
            _storeHash(uint256(chainId), ids[i], _hashes[i]);
        }
    }
}
