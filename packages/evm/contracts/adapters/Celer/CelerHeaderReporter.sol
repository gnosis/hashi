// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { HeaderReporter } from "../HeaderReporter.sol";
import { CelerReporter } from "./CelerReporter.sol";

contract CelerHeaderReporter is HeaderReporter, CelerReporter {
    constructor(
        address headerStorage,
        uint256 adapterChain,
        address celerBus,
        uint32 celerAdapterChain
    ) HeaderReporter(headerStorage, adapterChain) CelerReporter(celerBus, celerAdapterChain) {} // solhint-disable no-empty-blocks

    function _sendPayload(bytes memory payload, address adapter) internal virtual override {
        _celerSend(payload, adapter);
    }
}
