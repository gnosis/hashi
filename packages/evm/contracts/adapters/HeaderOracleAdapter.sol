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
        require(reporterChain != 0 && reporterAddress != address(0), "BA: invalid ctor call");
        REPORTER_CHAIN = reporterChain;
        REPORTER_ADDRESS = reporterAddress;
    }

    function _receivePayload(bytes memory payload) internal {
        (uint256 blockNumber, bytes32 blockHash) = abi.decode(payload, (uint256, bytes32));
        _storeHash(REPORTER_CHAIN, blockNumber, blockHash);
    }
}
