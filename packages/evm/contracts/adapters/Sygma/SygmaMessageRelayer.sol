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
        uint8 defaultDestinationDomainID,
        address defaultSygmaAdapter
    ) SygmaReporter(bridge, resourceID, defaultDestinationDomainID, defaultSygmaAdapter) {
        _yaho = yaho;
    }

    /**
        @dev Relays the messages via the Sygma bridge to default domain.
        @param messageIds IDs of the messages to pass over the Sygma bridge.
        @param sygmaAdapter Address of the Sygma adapter on the target chain.
    */
    function relayMessages(bytes32[] memory messageIds, address sygmaAdapter) public payable returns (bytes32) {
        bytes32[] memory hashes = new bytes32[](messageIds.length);
        for (uint256 i = 0; i < messageIds.length; i++) {
            hashes[i] = _yaho.hashes(messageIds[i]);
            emit MessageRelayed(address(this), messageIds[i]);
        }
        (uint64 depositNonce, ) = _reportData(messageIds, hashes, sygmaAdapter, _defaultDestinationDomainID, "");
        return bytes32(uint256(depositNonce));
    }
}
