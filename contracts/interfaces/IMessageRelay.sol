// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

interface MessageRelay {
    function relayMessages(bytes32[] memory messageIds) external payable returns (bytes32 receipts);
}
