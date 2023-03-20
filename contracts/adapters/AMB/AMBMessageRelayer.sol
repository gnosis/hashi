// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "../../interfaces/IMessageRelay.sol";
import "./IAMB.sol";
import "../../Yaho.sol";

contract AMBMessageRelay is MessageRelay {
    IAMB public immutable amb;
    Yaho public immutable yaho;
    address public ambAdapter;

    event MessageRelayed(address indexed emitter, bytes32 indexed messageId);

    constructor(IAMB _amb, Yaho _yaho, address _ambAdapter) {
        amb = _amb;
        yaho = _yaho;
        ambAdapter = _ambAdapter;
    }

    function relayMessages(bytes32[] memory messageIds) public payable returns (bytes32 receipt) {
        bytes32[] memory hashes;
        bytes memory data = abi.encodeWithSignature("storeHashes(bytes32[],bytes32[])", messageIds);
        receipt = amb.requireToPassMessage(ambAdapter, data, 0);
        for (uint i = 0; i < messageIds.length; i++) {
            uint256 id = uint256(messageIds[i]);
            hashes[i] = yaho.hashes(id);
            emit MessageRelayed(address(this), messageIds[i]);
        }
    }
}
