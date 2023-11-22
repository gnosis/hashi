// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { ICrossDomainMessenger } from "./ICrossDomainMessenger.sol";
import { OracleAdapter } from "../OracleAdapter.sol";
import { BlockHashOracleAdapter } from "../BlockHashOracleAdapter.sol";

contract L2CrossDomainMessengerAdapter is OracleAdapter, BlockHashOracleAdapter {
    ICrossDomainMessenger public immutable l2CrossDomainMessenger;
    address public immutable reporter;
    uint256 public immutable chainId;

    error ArrayLengthMissmatch(address emitter);
    error UnauthorizedHashReporter(address emitter, address reporter);
    error UnauthorizedL2CrossDomainMessenger(address emitter, address sender);

    constructor(ICrossDomainMessenger l2CrossDomainMessenger_, address reporter_, uint256 chainId_) {
        l2CrossDomainMessenger = l2CrossDomainMessenger_;
        reporter = reporter_;
        chainId = chainId_;
    }

    /// @dev Check that the l2CrossDomainMessenger and xDomainMessageSender are valid.
    modifier onlyValid() {
        if (msg.sender != address(l2CrossDomainMessenger))
            revert UnauthorizedL2CrossDomainMessenger(address(this), msg.sender);
        if (l2CrossDomainMessenger.xDomainMessageSender() != reporter)
            revert UnauthorizedHashReporter(address(this), reporter);
        _;
    }

    /// @dev Stores the hashes for a given array of ids.
    /// @param ids Array of ids number for which to set the hashes.
    /// @param hashes Array of hashes to set for the given ids.
    /// @notice Only callable by `l2CrossDomainMessenger` with a message passed from `reporter`.
    /// @notice Will revert if given array lengths do not match.
    function storeHashes(uint256[] memory ids, bytes32[] memory hashes) external onlyValid {
        if (ids.length != hashes.length) revert ArrayLengthMissmatch(address(this));
        for (uint256 i = 0; i < ids.length; i++) {
            _storeHash(chainId, ids[i], hashes[i]);
        }
    }
}
