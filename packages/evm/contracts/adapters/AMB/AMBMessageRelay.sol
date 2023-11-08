// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { MessageRelay } from "../MessageRelay.sol";
import { IAMB } from "./IAMB.sol";
import { IYaho } from "../../interfaces/IYaho.sol";
import { AMBAdapter } from "./AMBAdapter.sol";

contract AMBMessageRelay is MessageRelay {
    IAMB public immutable amb;

    event MessageRelayed(address indexed emitter, bytes32 indexed messageId);

    constructor(IAMB _amb, address yaho) MessageRelay(yaho) {
        amb = _amb;
    }

    function relayMessages(
        uint256[] memory,
        bytes32[] memory messageIds,
        bytes32[] calldata messageHashes,
        address ambAdapter
    ) external payable override onlyYaho returns (bytes32 receipt) {
        bytes32[] memory hashes = new bytes32[](messageIds.length);
        for (uint256 i = 0; i < messageIds.length; i++) {
            hashes[i] = messageHashes[i];
            emit MessageRelayed(address(this), messageIds[i]);
        }

        bytes memory data = abi.encodeCall(AMBAdapter.storeHashes, (messageIds, hashes));
        receipt = amb.requireToPassMessage(ambAdapter, data, 0);
    }
}
