// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { MessageRelay } from "../MessageRelay.sol";
import { SygmaReporter } from "./SygmaReporter.sol";

contract SygmaMessageRelay is SygmaReporter, MessageRelay {
    event MessageRelayed(address indexed emitter, bytes32 indexed messageId);

    constructor(
        address bridge,
        address yaho,
        bytes32 resourceID,
        address defaultSygmaAdapter
    ) SygmaReporter(bridge, resourceID, defaultSygmaAdapter) MessageRelay(yaho) {}

    /**
        @dev Relays the messages via the Sygma bridge to default domain.
        @param toChainIds Chain ids.
        @param messageIds IDs of the messages to pass over the Sygma bridge.
        @param messageHashes Hashes of the messages to pass over the Sygma bridge.
        @param sygmaAdapter Address of the Sygma adapter on the target chain.
    */
    function relayMessages(
        uint256[] calldata toChainIds,
        bytes32[] calldata messageIds,
        bytes32[] calldata messageHashes,
        address sygmaAdapter
    ) external payable override onlyYaho returns (bytes32) {
        if (toChainIds.length != messageIds.length || toChainIds.length != messageHashes.length)
            revert UnequalArrayLengths(address(this));
        uint256[] memory depositNonces = new uint256[](messageIds.length);
        for (uint256 i = 0; i < messageIds.length; i++) {
            bytes32[] memory singleMessageIds = new bytes32[](1);
            bytes32[] memory singleMessageHashes = new bytes32[](1);
            singleMessageIds[0] = messageIds[i];
            singleMessageHashes[0] = messageHashes[i];
            (depositNonces[i], ) = _reportData(
                singleMessageIds,
                singleMessageHashes,
                sygmaAdapter,
                uint8(toChainIds[i]),
                ""
            );
            emit MessageRelayed(address(this), messageIds[i]);
        }

        return bytes32(keccak256(abi.encode(depositNonces)));
    }
}
