// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { HeaderReporter } from "../HeaderReporter.sol";
import { PNetworkReporter } from "./PNetworkReporter.sol";

contract PNetworkHeaderReporter is HeaderReporter, PNetworkReporter {
    constructor(
        address headerStorage,
        uint64 adapterChain,
        address pNetworkVault,
        address pNetworkToken,
        bytes4 pNetworkAdapterNetworkId
    )
        HeaderReporter(headerStorage, adapterChain)
        PNetworkReporter(pNetworkVault, pNetworkToken, pNetworkAdapterNetworkId)
    {} // solhint-disable no-empty-blocks

    function _sendPayload(bytes memory payload, address adapter) internal override {
        _pNetworkSend(payload, adapter);
    }
}
