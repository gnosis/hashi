// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IXReceiver } from "@connext/interfaces/core/IXReceiver.sol";
import { HeaderOracleAdapter } from "../HeaderOracleAdapter.sol";

contract ConnextAdapter is HeaderOracleAdapter, IXReceiver {
    string public constant PROVIDER = "connext";
    address public immutable CONNEXT;
    uint32 public immutable CONNEXT_REPORTER_CHAIN;

    error UnauthorizedConnextReceive();

    constructor(
        uint256 reporterChain,
        address reporterAddress,
        address connext,
        uint32 connextReporterChain
    ) HeaderOracleAdapter(reporterChain, reporterAddress) {
        CONNEXT = connext;
        CONNEXT_REPORTER_CHAIN = connextReporterChain;
    }

    function xReceive(
        bytes32 /* transferId_ */,
        uint256 /* amount_ */,
        address /* asset_ */,
        address originSender,
        uint32 origin,
        bytes memory callData
    ) external returns (bytes memory) {
        if (msg.sender != CONNEXT || origin != CONNEXT_REPORTER_CHAIN || originSender != REPORTER_ADDRESS)
            revert UnauthorizedConnextReceive();
        _receivePayload(callData);
        return "";
    }
}
