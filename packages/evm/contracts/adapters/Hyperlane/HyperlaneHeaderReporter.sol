// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { HeaderReporter } from "../HeaderReporter.sol";
import { HyperlaneReporter } from "./HyperlaneReporter.sol";

contract HyperlaneHeaderReporter is HeaderReporter, HyperlaneReporter {
    constructor(
        address headerStorage,
        uint256 adapterChain,
        address hyperlaneMailbox,
        uint32 hyperlaneAdapterChain
    ) HeaderReporter(headerStorage, adapterChain) HyperlaneReporter(hyperlaneMailbox, hyperlaneAdapterChain) {} // solhint-disable no-empty-blocks

    function _sendPayload(bytes memory payload, address adapter) internal override {
        _hyperlaneSend(payload, adapter);
    }
}
