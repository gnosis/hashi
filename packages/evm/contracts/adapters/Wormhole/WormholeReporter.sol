// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Reporter } from "../Reporter.sol";
import { IOracleAdapter } from "../../interfaces/IOracleAdapter.sol";
import { IWormhole } from "./interfaces/IWormhole.sol";

contract WormholeReporter is Reporter {
    string public constant PROVIDER = "wormhole";

    IWormhole public immutable WOMRHOLE;

    constructor(address headerStorage, address yaho, address wormhole) Reporter(headerStorage, yaho) {
        WOMRHOLE = IWormhole(wormhole);
    }

    function _dispatch(
        uint256,
        address,
        uint256[] memory ids,
        bytes32[] memory hashes
    ) internal override returns (bytes32) {
        bytes memory payload = abi.encode(ids, hashes);
        uint32 nonce = 0;
        uint8 consistencyLevel = 201;
        uint64 sequence = WOMRHOLE.publishMessage(nonce, payload, consistencyLevel);
        return bytes32(abi.encode(sequence));
    }
}
