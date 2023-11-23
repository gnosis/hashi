// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { CCIPReceiver } from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import { Client } from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import { HeaderOracleAdapter } from "../HeaderOracleAdapter.sol";

contract ChainlinkAdapter is HeaderOracleAdapter, CCIPReceiver {
    string public constant PROVIDER = "chainlink";
    uint64 public immutable CHAINLINK_REPORTER_CHAIN;

    error UnauthorizedChainlinkReceive();

    constructor(
        uint256 reporterChain,
        address reporterAddress,
        address chainlinkRouter,
        uint64 chainlinkReporterChain
    ) HeaderOracleAdapter(reporterChain, reporterAddress) CCIPReceiver(chainlinkRouter) {
        CHAINLINK_REPORTER_CHAIN = chainlinkReporterChain;
    }

    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        // Validity of `msg.sender` is ensured by `CCIPReceiver` prior this internal function invocation
        if (
            message.sourceChainSelector != CHAINLINK_REPORTER_CHAIN ||
            abi.decode(message.sender, (address)) != REPORTER_ADDRESS
        ) revert UnauthorizedChainlinkReceive();
        _receivePayload(message.data);
    }
}
