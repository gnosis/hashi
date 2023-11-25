// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { MessageRelay } from "../MessageRelay.sol";
import { HyperlaneReporter } from "./HyperlaneReporter.sol";

contract HyperlaneMessageRelay is MessageRelay, HyperlaneReporter {
    constructor(
        address yaho,
        uint256 adapterChain,
        address hyperlaneMailbox,
        uint32 hyperlaneAdapterChain
    ) MessageRelay(yaho, adapterChain) HyperlaneReporter(hyperlaneMailbox, hyperlaneAdapterChain) {} // solhint-disable no-empty-blocks

    function _sendPayload(bytes memory payload, address adapter) internal override {
        _hyperlaneSend(payload, adapter);
    }
}
