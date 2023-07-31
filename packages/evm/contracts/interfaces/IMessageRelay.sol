// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

interface IMessageRelay {
    function relayMessages(
        uint256[] memory messageIds,
        address adapter,
        uint256 gas
    ) external payable returns (bytes32 receipts);
}
