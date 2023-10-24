// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageRelay } from "../../interfaces/IMessageRelay.sol";
import { IAMB } from "./IAMB.sol";
import { Yaho } from "../../Yaho.sol";
import { AMBAdapter } from "./AMBAdapter.sol";

contract AMBMessageRelay is IMessageRelay {
    IAMB public immutable amb;
    Yaho public immutable yaho;

    event MessageRelayed(address indexed emitter, uint256 indexed messageId);

    constructor(IAMB _amb, Yaho _yaho) {
        amb = _amb;
        yaho = _yaho;
    }

    function relayMessages(
        uint256[] calldata messageIds,
        address ambAdapter,
        bytes calldata data
    ) public payable returns (bytes32 receipt) {
        bytes32[] memory hashes = new bytes32[](messageIds.length);
        for (uint256 i = 0; i < messageIds.length; i++) {
            uint256 id = messageIds[i];
            hashes[i] = yaho.hashes(id);
            emit MessageRelayed(address(this), messageIds[i]);
        }

        uint256 gas = 350000; // NOTE: 350000 is the default value
        if (data.length > 0) {
            (gas) = abi.decode(data, (uint256));
        }

        receipt = amb.requireToPassMessage(
            ambAdapter,
            abi.encodeCall(AMBAdapter.storeHashes, (messageIds, hashes)),
            gas
        );
    }
}
