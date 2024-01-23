// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

interface IMessageIdCalculator {
    function calculateMessageId(
        uint256 fromChainId,
        address dispatcherAddress,
        bytes32 messageHash
    ) external pure returns (uint256);
}
