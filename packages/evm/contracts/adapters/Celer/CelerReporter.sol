// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Reporter } from "../Reporter.sol";
import { IMessageBus } from "./interfaces/IMessageBus.sol";

contract CelerReporter is Reporter {
    string public constant PROVIDER = "celer";
    IMessageBus public immutable CELER_BUS;

    constructor(address headerStorage, address yaho, address celerBus) Reporter(headerStorage, yaho) {
        CELER_BUS = IMessageBus(celerBus);
    }

    function _dispatch(
        uint256 toChainId,
        address adapter,
        uint256[] memory ids,
        bytes32[] memory hashes
    ) internal override returns (bytes32) {
        bytes memory payload = abi.encode(ids, hashes);
        CELER_BUS.sendMessage{ value: msg.value }(adapter, toChainId, payload);
        return bytes32(0);
    }
}
