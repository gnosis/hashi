// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { MessageRelay } from "../adapters/MessageRelay.sol";

contract MockMessageRelay is MessageRelay {
    uint256 public count;

    event MessageRelayed(bytes32 messageId);

    constructor(address yaho) MessageRelay(yaho) {}

    function relayMessages(
        uint256[] calldata,
        bytes32[] calldata messageIds,
        bytes32[] calldata,
        address
    ) external payable override onlyYaho returns (bytes32 receipts) {
        for (uint256 i = 0; i < messageIds.length; i++) {
            count++;
            emit MessageRelayed(messageIds[i]);
        }
        receipts = bytes32(count);
    }
}
