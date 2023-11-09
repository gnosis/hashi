// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageBus } from "./interfaces/IMessageBus.sol";
import { HeaderReporter } from "../HeaderReporter.sol";

contract CelerReporter is HeaderReporter {
    string public constant PROVIDER = "celer";
    address public immutable CELER_BUS;
    uint64 public immutable CELER_ADAPTER_CHAIN;

    constructor(
        address headerStorage,
        uint256 adapterChain,
        address adapterAddress,
        address celerBus,
        uint32 celerAdapterChain
    ) HeaderReporter(headerStorage, adapterChain, adapterAddress) {
        require(celerBus != address(0), "ER: invalid ctor call");
        CELER_BUS = celerBus;
        CELER_ADAPTER_CHAIN = celerAdapterChain;
    }

    function _sendPayload(bytes memory payload) internal override {
        IMessageBus(CELER_BUS).sendMessage{ value: msg.value }(ADAPTER_ADDRESS, CELER_ADAPTER_CHAIN, payload);
    }
}
