// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageRelay } from "../../interfaces/IMessageRelay.sol";
import { SygmaReporter } from "./SygmaReporter.sol";
import { Yaho } from "../../Yaho.sol";

contract SygmaMessageRelayer is SygmaReporter, IMessageRelay {
    Yaho public immutable _yaho;

    event MessageRelayed(address indexed emitter, bytes32 indexed messageId);

    constructor(
        address bridge,
        Yaho yaho,
        bytes32 resourceID,
        address defaultSygmaAdapter
    ) SygmaReporter(bridge, resourceID, defaultSygmaAdapter) {
        _yaho = yaho;
    }

    /**
        @dev Relays the messages via the Sygma bridge to default domain.
        @param messageIds IDs of the messages to pass over the Sygma bridge.
        @param sygmaAdapter Address of the Sygma adapter on the target chain.
    */
    function relayMessages(
        uint256[] calldata toChainIds,
        bytes32[] calldata messageIds,
        address sygmaAdapter
    ) public payable returns (bytes32) {
        // TODO: group messages by toChainId
        uint256[] memory depositNonces = new uint256[](messageIds.length);
        for (uint256 i = 0; i < messageIds.length; i++) {
            bytes32 messageHash = _yaho.hashes(messageIds[i]);
            (depositNonces[i], ) = _reportData(messageIds[i], messageHash, sygmaAdapter, uint8(toChainIds[i]), "");
            emit MessageRelayed(address(this), messageIds[i]);
        }

        return bytes32(keccak256(abi.encode(depositNonces)));
    }
}
