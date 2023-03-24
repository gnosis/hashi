// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "../../interfaces/IMessageRelay.sol";
import "./IAMB.sol";
import "../../Yaho.sol";

contract AMBMessageRelay is IMessageRelay {
    IAMB public immutable amb;
    Yaho public immutable yaho;

    event MessageRelayed(address indexed emitter, uint256 indexed messageId);

    constructor(IAMB _amb, Yaho _yaho) {
        amb = _amb;
        yaho = _yaho;
    }

    function relayMessages(uint256[] memory messageIds, address ambAdapter) public payable returns (bytes32 receipt) {
        bytes32[] memory hashes = new bytes32[](messageIds.length);
        for (uint i = 0; i < messageIds.length; i++) {
            uint256 id = messageIds[i];
            hashes[i] = yaho.hashes(id);
            emit MessageRelayed(address(this), messageIds[i]);
        }
        bytes memory data = abi.encodeWithSignature("storeHashes(uint256[],bytes32[])", messageIds, hashes);
        receipt = amb.requireToPassMessage(ambAdapter, data, 0);
    }
}
