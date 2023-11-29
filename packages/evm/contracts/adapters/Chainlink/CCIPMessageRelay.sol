// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { MessageRelay } from "../MessageRelay.sol";
import { CCIPReporter } from "./CCIPReporter.sol";

contract CCIPMessageRelay is MessageRelay, CCIPReporter {
    constructor(
        address yaho,
        uint64 adapterChain,
        address ccipRouter,
        uint64 ccipAdapterChain
    ) MessageRelay(yaho, adapterChain) CCIPReporter(ccipRouter, ccipAdapterChain) {} // solhint-disable no-empty-blocks

    function _sendPayload(bytes memory payload, address adapter) internal override {
        _ccipSend(payload, adapter);
    }
}
