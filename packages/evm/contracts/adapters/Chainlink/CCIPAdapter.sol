// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { CCIPReceiver } from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import { Client } from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import { HeaderOracleAdapter } from "../HeaderOracleAdapter.sol";

contract CCIPAdapter is HeaderOracleAdapter, CCIPReceiver {
    string public constant PROVIDER = "ccip";
    uint64 public immutable CCIP_REPORTER_CHAIN;

    error UnauthorizedCCIPReceive();

    constructor(
        uint256 reporterChain,
        address reporterAddress,
        address ccipRouter,
        uint64 ccipReporterChain
    ) HeaderOracleAdapter(reporterChain, reporterAddress) CCIPReceiver(ccipRouter) {
        CCIP_REPORTER_CHAIN = ccipReporterChain;
    }

    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        // Validity of `msg.sender` is ensured by `CCIPReceiver` prior this internal function invocation
        if (
            message.sourceChainSelector != CCIP_REPORTER_CHAIN ||
            abi.decode(message.sender, (address)) != REPORTER_ADDRESS
        ) revert UnauthorizedCCIPReceive();
        _receivePayload(message.data);
    }
}
