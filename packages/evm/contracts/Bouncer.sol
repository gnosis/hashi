// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { IAdapter } from "./interfaces/IAdapter.sol";
import { IReporter } from "./interfaces/IReporter.sol";
import { IYaho } from "./interfaces/IYaho.sol";
import { IBouncer } from "./interfaces/IBouncer.sol";
import { HopDecoder } from "./libraries/HopDecoder.sol";

contract Bouncer is IBouncer {
    address public immutable YAHO;
    address public immutable YARU;

    constructor(address yaho, address yaru) {
        YAHO = yaho;
        YARU = yaru;
    }

    function onMessage(
        uint256,
        uint256 sourceChainId,
        address sender,
        uint256 threshold,
        IAdapter[] calldata adapters,
        bytes calldata data
    ) external returns (bytes memory) {
        if (msg.sender != YARU) revert NotYaru();

        (
            ,
            uint8 hopsNonce,
            ,
            ,
            uint256 nextChainId,
            address receiver,
            uint256 expectedSourceChainId,
            address expectedSender,
            uint256 expectedThreshold,
            bytes32 expectedAdaptersHash,
            uint256 nextThreshold,
            IReporter[] memory nextReporters,
            IAdapter[] memory nextAdapters,
            bytes memory message
        ) = HopDecoder.decodeCurrentHop(data);

        if (sourceChainId != expectedSourceChainId) revert InvalidSourceChainId();
        if (sender != expectedSender) revert InvalidSender();
        if (threshold < expectedThreshold) revert InvalidThreshold();
        if (keccak256(abi.encodePacked(adapters)) != expectedAdaptersHash) revert InvalidAdapters();

        bytes memory dataWithUpdatedNonce = abi.encodePacked(
            data[:7 + message.length],
            bytes1(hopsNonce + 1),
            data[7 + 1 + message.length:]
        );
        IYaho(YAHO).dispatchMessage(
            nextChainId,
            nextThreshold,
            receiver,
            dataWithUpdatedNonce,
            nextReporters,
            nextAdapters
        );

        return abi.encodePacked(true);
    }
}
