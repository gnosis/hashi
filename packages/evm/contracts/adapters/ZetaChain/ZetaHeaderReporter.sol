// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { HeaderReporter } from "../HeaderReporter.sol";
import { ZetaReporter } from "./ZetaReporter.sol";

contract ZetaHeaderReporter is HeaderReporter, ZetaReporter {
    constructor(
        address headerStorage,
        uint256 adapterChain,
        address zetaConnector,
        address zetaToken,
        address zetaConsumer
    ) HeaderReporter(headerStorage, adapterChain) ZetaReporter(zetaConnector, zetaToken, zetaConsumer, adapterChain) {} // solhint-disable no-empty-blocks

    function _sendPayload(bytes memory payload, address adapter) internal override {
        _zetaSend(payload, adapter);
    }
}
