// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IYaho } from "../../interfaces/IYaho.sol";
import { IWormhole } from "./IWormhole.sol";

contract WormholeMessageRelay {
    IWormhole public immutable wormhole;
    IYaho public immutable yaho;

    event MessageRelayed(address indexed emitter, uint256 indexed messageId);

    constructor(IWormhole wormhole_, IYaho yaho_) {
        wormhole = wormhole_;
        yaho = yaho_;
    }

    function relayMessages(uint256[] memory messageIds, address) external payable returns (bytes32) {
        bytes32[] memory hashes = new bytes32[](messageIds.length);
        for (uint256 i = 0; i < messageIds.length; i++) {
            hashes[i] = yaho.hashes(messageIds[i]);
            emit MessageRelayed(address(this), messageIds[i]);
        }
        bytes memory payload = abi.encode(messageIds, hashes);
        uint32 nonce = 0;
        uint8 consistencyLevel = 201;
        uint64 sequence = wormhole.publishMessage(nonce, payload, consistencyLevel);
        return bytes32(abi.encode(sequence));
    }
}
