// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageRelay } from "../interfaces/IMessageRelay.sol";
import { Yaho } from "../Yaho.sol";

abstract contract MessageRelay is IMessageRelay {
    Yaho public immutable YAHO;
    uint256 public immutable ADAPTER_CHAIN;

    event MessageRelayed(address indexed emitter, uint256 indexed messageId);

    /// @dev Constructs base reporter abstracted from specific message transport
    /// @param yaho Yaho contract that is served to dispatch and relay messages
    /// @param adapterChain Chain ID of the adapter that is served by this reporter
    constructor(address yaho, uint256 adapterChain) {
        YAHO = Yaho(yaho);
        ADAPTER_CHAIN = adapterChain;
    }

    function relayMessages(uint256[] memory messageIds, address adapter) external payable returns (bytes32) {
        bytes32[] memory hashes = new bytes32[](messageIds.length);
        for (uint256 i = 0; i < messageIds.length; i++) {
            hashes[i] = YAHO.hashes(messageIds[i]);
            emit MessageRelayed(address(this), messageIds[i]);
        }
        bytes memory payload = abi.encode(messageIds, hashes);
        _sendPayload(payload, adapter);
        return keccak256(abi.encode(true));
    }

    function _sendPayload(bytes memory payload, address adapter) internal virtual;
}
