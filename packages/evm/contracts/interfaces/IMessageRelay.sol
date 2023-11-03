// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

interface IMessageRelay {
    function relayMessages(
        bytes32[] memory messageIds,
        uint256[] memory toChainIds,
        address adapter
    ) external payable returns (bytes32 receipts);
}
