// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageRelay } from "../interfaces/IMessageRelay.sol";

abstract contract MessageRelay is IMessageRelay {
    address public immutable yaho;

    error NotYaho(address yaho, address expectedYaho);
    error UnequalArrayLengths(address emitter);

    constructor(address yaho_) {
        yaho = yaho_;
    }

    modifier onlyYaho() {
        if (msg.sender != yaho) revert NotYaho(msg.sender, yaho);
        _;
    }

    function relayMessages(
        uint256[] memory toChainIds,
        bytes32[] memory messageIds,
        bytes32[] calldata messageHashes,
        address adapter
    ) external payable virtual returns (bytes32 receipts);
}
