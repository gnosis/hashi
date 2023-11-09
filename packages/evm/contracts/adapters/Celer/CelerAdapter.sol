// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageReceiverApp } from "./interfaces/IMessageReceiverApp.sol";
import { HeaderOracleAdapter } from "../HeaderOracleAdapter.sol";

contract CelerAdapter is HeaderOracleAdapter, IMessageReceiverApp {
    string public constant PROVIDER = "celer";
    address public immutable CELER_BUS;
    uint32 public immutable CELER_REPORTER_CHAIN;

    constructor(
        uint256 reporterChain,
        address reporterAddress,
        address celerBus,
        uint32 celerReporterChain
    ) HeaderOracleAdapter(reporterChain, reporterAddress) {
        require(celerBus != address(0), "EA: invalid ctor call");
        CELER_BUS = celerBus;
        CELER_REPORTER_CHAIN = celerReporterChain;
    }

    function executeMessage(
        address sender,
        uint64 srcChainId,
        bytes calldata message,
        address /* executor */
    ) external payable returns (ExecutionStatus) {
        require(
            msg.sender == CELER_BUS && srcChainId == CELER_REPORTER_CHAIN && sender == REPORTER_ADDRESS,
            "EA: auth"
        );
        _receivePayload(message);
        return ExecutionStatus.Success;
    }
}
