// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { HeaderReporter } from "../HeaderReporter.sol";
import { ConnextReporter } from "./ConnextReporter.sol";

contract ConnextHeaderReporter is HeaderReporter, ConnextReporter {
    constructor(
        address headerStorage,
        uint256 adapterChain,
        address connext,
        uint32 connextAdapterChain
    ) HeaderReporter(headerStorage, adapterChain) ConnextReporter(connext, connextAdapterChain) {} // solhint-disable no-empty-blocks

    function _sendPayload(bytes memory payload, address adapter) internal override {
        _connextSend(payload, adapter);
    }
}
