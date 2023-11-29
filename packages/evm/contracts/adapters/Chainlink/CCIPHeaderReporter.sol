// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { HeaderReporter } from "../HeaderReporter.sol";
import { CCIPReporter } from "./CCIPReporter.sol";

contract CCIPHeaderReporter is HeaderReporter, CCIPReporter {
    constructor(
        address headerStorage,
        uint64 adapterChain,
        address ccipRouter,
        uint64 ccipAdapterChain
    ) HeaderReporter(headerStorage, adapterChain) CCIPReporter(ccipRouter, ccipAdapterChain) {} // solhint-disable no-empty-blocks

    function _sendPayload(bytes memory payload, address adapter) internal override {
        _ccipSend(payload, adapter);
    }
}
