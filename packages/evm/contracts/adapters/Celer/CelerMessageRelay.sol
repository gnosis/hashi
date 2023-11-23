// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { MessageRelay } from "../MessageRelay.sol";
import { CelerReporter } from "./CelerReporter.sol";

contract CelerMessageRelay is MessageRelay, CelerReporter {
    constructor(
        address yaho,
        uint256 adapterChain,
        address celerBus,
        uint32 celerAdapterChain
    ) MessageRelay(yaho, adapterChain) CelerReporter(celerBus, celerAdapterChain) {} // solhint-disable no-empty-blocks

    function _sendPayload(bytes memory payload, address adapter) internal virtual override {
        _celerSend(payload, adapter);
    }
}
