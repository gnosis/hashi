// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageRelay } from "../interfaces/IMessageRelay.sol";

contract MockMessageRelay is IMessageRelay {
    uint256 public count;

    function relayMessages(uint256[] memory, address) external payable returns (bytes32 receipts) {
        receipts = bytes32(count);
        count++;
    }
}
