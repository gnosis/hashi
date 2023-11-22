// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageReceiverApp } from "./interfaces/IMessageReceiverApp.sol";
import { HeaderOracleAdapter } from "../HeaderOracleAdapter.sol";

contract CelerAdapter is HeaderOracleAdapter, IMessageReceiverApp {
    string public constant PROVIDER = "celer";
    address public immutable CELER_BUS;
    uint32 public immutable CELER_REPORTER_CHAIN;

    error UnauthorizedCelerReceive();

    constructor(
        uint256 reporterChain,
        address reporterAddress,
        address celerBus,
        uint32 celerReporterChain
    ) HeaderOracleAdapter(reporterChain, reporterAddress) {
        CELER_BUS = celerBus;
        CELER_REPORTER_CHAIN = celerReporterChain;
    }

    function executeMessage(
        address sender,
        uint64 srcChainId,
        bytes calldata message,
        address /* executor */
    ) external payable returns (ExecutionStatus) {
        if (msg.sender != CELER_BUS || srcChainId != CELER_REPORTER_CHAIN || sender != REPORTER_ADDRESS)
            revert UnauthorizedCelerReceive();

        _receivePayload(message);
        return ExecutionStatus.Success;
    }
}
