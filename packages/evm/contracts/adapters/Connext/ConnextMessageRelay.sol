// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { MessageRelay } from "../MessageRelay.sol";
import { ConnextReporter } from "./ConnextReporter.sol";

contract ConnextMessageRelay is MessageRelay, ConnextReporter {
    constructor(
        address yaho,
        uint256 adapterChain,
        address connext,
        uint32 connextAdapterChain
    ) MessageRelay(yaho, adapterChain) ConnextReporter(connext, connextAdapterChain) {} // solhint-disable no-empty-blocks

    function _sendPayload(bytes memory payload, address adapter) internal override {
        _connextSend(payload, adapter);
    }
}
