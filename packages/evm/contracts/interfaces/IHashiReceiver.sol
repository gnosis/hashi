// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

interface IHashiReceiver {
    function onMessage(
        bytes calldata data,
        bytes32 messageId,
        uint256 fromChainId,
        address from
    ) external returns (bytes memory);
}
