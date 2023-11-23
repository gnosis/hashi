// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageBus } from "./interfaces/IMessageBus.sol";

abstract contract CelerReporter {
    string public constant PROVIDER = "celer";
    IMessageBus public immutable CELER_BUS;
    uint64 public immutable CELER_ADAPTER_CHAIN;

    constructor(address celerBus, uint32 celerAdapterChain) {
        CELER_BUS = IMessageBus(celerBus);
        CELER_ADAPTER_CHAIN = celerAdapterChain;
    }

    function _celerSend(bytes memory payload, address adapter) internal {
        CELER_BUS.sendMessage{ value: msg.value }(adapter, CELER_ADAPTER_CHAIN, payload);
    }
}
