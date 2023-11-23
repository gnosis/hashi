// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { HeaderReporter } from "../HeaderReporter.sol";
import { ChainlinkReporter } from "./ChainlinkReporter.sol";

contract ChainlinkHeaderReporter is HeaderReporter, ChainlinkReporter {
    constructor(
        address headerStorage,
        uint64 adapterChain,
        address chainlinkRouter,
        uint64 chainlinkAdapterChain
    ) HeaderReporter(headerStorage, adapterChain) ChainlinkReporter(chainlinkRouter, chainlinkAdapterChain) {} // solhint-disable no-empty-blocks

    function _sendPayload(bytes memory payload, address adapter) internal override {
        _chainlinkSend(payload, adapter);
    }
}
