// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageRelay } from "../interfaces/IMessageRelay.sol";

contract MockMessageRelay is IMessageRelay {
    uint256 public count;

    event MessageRelayed(bytes32 messageId);

    function relayMessages(
        uint256[] calldata,
        bytes32[] calldata messageIds,
        address
    ) external payable returns (bytes32 receipts) {
        for (uint256 i = 0; i < messageIds.length; i++) {
            count++;
            emit MessageRelayed(messageIds[i]);
        }
        receipts = bytes32(count);
    }
}
