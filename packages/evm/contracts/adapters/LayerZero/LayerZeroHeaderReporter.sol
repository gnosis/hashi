// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { HeaderReporter } from "../HeaderReporter.sol";
import { LayerZeroReporter } from "./LayerZeroReporter.sol";

contract LayerZeroHeaderReporter is HeaderReporter, LayerZeroReporter {
    constructor(
        address headerStorage,
        uint256 adapterChain,
        address lzEndpoint,
        uint16 lzAdapterChain
    ) HeaderReporter(headerStorage, adapterChain) LayerZeroReporter(lzEndpoint, lzAdapterChain) {} // solhint-disable no-empty-blocks

    function _sendPayload(bytes memory payload, address adapter) internal override {
        _lzSend(payload, adapter);
    }
}
