// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { MessageRelay } from "../MessageRelay.sol";
import { ZetaReporter } from "./ZetaReporter.sol";

contract ZetaMessageRelay is MessageRelay, ZetaReporter {
    constructor(
        address yaho,
        uint256 adapterChain,
        address zetaConnector,
        address zetaToken,
        address zetaConsumer
    ) MessageRelay(yaho, adapterChain) ZetaReporter(zetaConnector, zetaToken, zetaConsumer, adapterChain) {} // solhint-disable no-empty-blocks

    function _sendPayload(bytes memory payload, address adapter) internal override {
        _zetaSend(payload, adapter);
    }
}
