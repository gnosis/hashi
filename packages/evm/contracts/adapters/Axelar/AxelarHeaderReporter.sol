// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { HeaderReporter } from "../HeaderReporter.sol";
import { AxelarReporter } from "./AxelarReporter.sol";

contract AxelarHeaderReporter is HeaderReporter, AxelarReporter {
    constructor(
        address headerStorage,
        uint256 adapterChain,
        address axelarGateway,
        address axelarGasService,
        string memory axelarAdapterChain
    ) HeaderReporter(headerStorage, adapterChain) AxelarReporter(axelarGateway, axelarGasService, axelarAdapterChain) {} // solhint-disable no-empty-blocks

    function _sendPayload(bytes memory payload, address adapter) internal override {
        _axelarSend(payload, adapter);
    }
}
