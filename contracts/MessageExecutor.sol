// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "./interfaces/IHashi.sol";
import "./interfaces/IMessage.sol";

contract MessageExecutor {
    IHashi immutable hashi;
    mapping(uint256 => bool) public executed;

    error UnequalArrayLengths(address emitter);
    error AlreadyExecuted(address emitter, uint256 id);
    error HashMismatch(address emitter, uint256 id, bytes32 reportedHash, bytes32 calculatedHash);
    error CallFailed(address emitter, uint256 id);

    constructor(IHashi _hashi) {
        hashi = _hashi;
    }

    function executeMessagesFromOracles(
        Message[] memory messages,
        uint256[] memory messageIds,
        address[] memory senders,
        IOracleAdapter[] memory oracleAdapters
    ) public returns (bytes memory data) {
        if (messages.length != senders.length || messages.length != messageIds.length)
            revert UnequalArrayLengths(address(this));
        for (uint i = 0; i < messages.length; i++) {
            uint256 id = messageIds[i];
            if (executed[id]) revert AlreadyExecuted(address(this), id);
            Message memory message = messages[i];
            bytes32 reportedHash = hashi.getHash(message.toChainId, id, oracleAdapters);
            bytes32 calculatedHash = keccak256(abi.encode(id, senders[i], msg.sender, message));
            if (reportedHash != calculatedHash) revert HashMismatch(address(this), id, reportedHash, calculatedHash);
            bool success;
            (success, data) = address(message.to).call(message.data);
            if (!success) revert CallFailed(address(this), id);
        }
    }
}
