// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { MessageRelay } from "../MessageRelay.sol";
import { AxelarReporter } from "./AxelarReporter.sol";

contract AxelarMessageRelay is MessageRelay, AxelarReporter {
    constructor(
        address yaho,
        uint256 adapterChain,
        address axelarGateway,
        address axelarGasService,
        string memory axelarAdapterChain
    ) MessageRelay(yaho, adapterChain) AxelarReporter(axelarGateway, axelarGasService, axelarAdapterChain) {} // solhint-disable no-empty-blocks

    function _sendPayload(bytes memory payload, address adapter) internal override {
        _axelarSend(payload, adapter);
    }
}
