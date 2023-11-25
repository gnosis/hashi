// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageRecipient } from "@hyperlane-xyz/core/contracts/interfaces/IMessageRecipient.sol";
import { HeaderOracleAdapter } from "../HeaderOracleAdapter.sol";

contract HyperlaneAdapter is HeaderOracleAdapter, IMessageRecipient {
    string public constant PROVIDER = "hyperlane";
    address public immutable HYPERLANE_MAILBOX;
    uint32 public immutable HYPERLANE_REPORTER_CHAIN;
    bytes32 public immutable HYPERLANE_REPORTER_ADDRESS;

    error UnauthorizedHyperlaneReceive();

    constructor(
        uint256 reporterChain,
        address reporterAddress,
        address hyperlaneMailbox,
        uint32 hyperlaneReporterChain,
        bytes32 hyperlaneReporterAddress
    ) HeaderOracleAdapter(reporterChain, reporterAddress) {
        HYPERLANE_MAILBOX = hyperlaneMailbox;
        HYPERLANE_REPORTER_CHAIN = hyperlaneReporterChain;
        HYPERLANE_REPORTER_ADDRESS = hyperlaneReporterAddress;
    }

    function handle(uint32 origin, bytes32 sender, bytes calldata message) external payable {
        if (
            msg.sender != HYPERLANE_MAILBOX ||
            origin != HYPERLANE_REPORTER_CHAIN ||
            sender != HYPERLANE_REPORTER_ADDRESS
        ) revert UnauthorizedHyperlaneReceive();
        _receivePayload(message);
    }
}
