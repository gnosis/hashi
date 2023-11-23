// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { MessageRelay } from "../MessageRelay.sol";
import { ChainlinkReporter } from "./ChainlinkReporter.sol";

contract ChainlinkMessageRelay is MessageRelay, ChainlinkReporter {
    constructor(
        address yaho,
        uint64 adapterChain,
        address chainlinkRouter,
        uint64 chainlinkAdapterChain
    ) MessageRelay(yaho, adapterChain) ChainlinkReporter(chainlinkRouter, chainlinkAdapterChain) {} // solhint-disable no-empty-blocks

    function _sendPayload(bytes memory payload, address adapter) internal override {
        _chainlinkSend(payload, adapter);
    }
}
