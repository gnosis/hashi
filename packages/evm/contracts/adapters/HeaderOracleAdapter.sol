// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { BlockHashOracleAdapter } from "./BlockHashOracleAdapter.sol";

abstract contract HeaderOracleAdapter is BlockHashOracleAdapter {
    uint256 public immutable REPORTER_CHAIN;
    address public immutable REPORTER_ADDRESS;

    /// @dev Constructs base adapter abstracted from specific message transport
    /// @param reporterChain Chain ID of the reporter this adapter is served by
    /// @param reporterAddress Address of the reporter this adapter is served by
    constructor(uint256 reporterChain, address reporterAddress) {
        REPORTER_CHAIN = reporterChain;
        REPORTER_ADDRESS = reporterAddress;
    }

    function _receivePayload(bytes memory payload) internal {
        (uint256[] memory ids, bytes32[] memory hashes) = abi.decode(payload, (uint256[], bytes32[]));
        for (uint256 i = 0; i < ids.length; i++) {
            _storeHash(REPORTER_CHAIN, ids[i], hashes[i]);
        }
    }
}
