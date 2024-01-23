// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

interface IJushin {
    function onMessage(
        uint256 fromChainId,
        uint256 messageId,
        address sender,
        bytes calldata data
    ) external returns (bytes memory);
}
