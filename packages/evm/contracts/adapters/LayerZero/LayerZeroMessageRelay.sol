// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { MessageRelay } from "../MessageRelay.sol";
import { LayerZeroReporter } from "./LayerZeroReporter.sol";

contract LayerZeroMessageRelay is MessageRelay, LayerZeroReporter {
    constructor(
        address yaho,
        uint256 adapterChain,
        address lzEndpoint,
        uint16 lzAdapterChain
    ) MessageRelay(yaho, adapterChain) LayerZeroReporter(lzEndpoint, lzAdapterChain) {} // solhint-disable no-empty-blocks

    function _sendPayload(bytes memory payload, address adapter) internal override {
        _lzSend(payload, adapter);
    }
}
