// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { ICrossDomainMessenger } from "./ICrossDomainMessenger.sol";
import { IYaho } from "../../interfaces/IYaho.sol";

contract L1CrossDomainMessengerMessageRelay {
    // The first 1.92 million gas on L2 is free. See here:
    // https://community.optimism.io/docs/developers/bridge/messaging/#for-l1-%E2%87%92-l2-transactions
    uint32 internal constant GAS_LIMIT = 1_920_000;

    ICrossDomainMessenger public immutable l1CrossDomainMessenger;
    IYaho public immutable yaho;

    event MessageRelayed(address indexed emitter, uint256 indexed messageId);

    constructor(ICrossDomainMessenger l1CrossDomainMessenger_, IYaho yaho_) {
        l1CrossDomainMessenger = l1CrossDomainMessenger_;
        yaho = yaho_;
    }

    /// @dev Reports the given messages to the adapter via the L1CrossDomainMessenger.
    /// @param messageIds Uint256 array message ids to pass over the L1CrossDomainMessenger.
    /// @param adapter address of L2CrossDomainMessengerAdapter on the destination chain.
    function relayMessages(uint256[] memory messageIds, address adapter) external payable returns (bytes32 receipt) {
        bytes32[] memory hashes = new bytes32[](messageIds.length);
        for (uint256 i = 0; i < messageIds.length; i++) {
            uint256 id = messageIds[i];
            hashes[i] = yaho.hashes(id);
            emit MessageRelayed(address(this), messageIds[i]);
        }
        bytes memory message = abi.encodeWithSignature("storeHashes(uint256[],bytes32[])", messageIds, hashes);
        l1CrossDomainMessenger.sendMessage{ value: msg.value }(adapter, message, GAS_LIMIT);
        return keccak256(abi.encode(true));
    }
}
