// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "./interfaces/IHashi.sol";
import "./interfaces/IMessage.sol";

contract MessageExecutor {
    IHashi public immutable hashi;
    address public immutable yaho;
    mapping(uint256 => bool) public executed;

    event MessageIdExecuted(uint256 indexed fromChainId, bytes32 indexed messageId);

    error UnequalArrayLengths(address emitter);
    error AlreadyExecuted(address emitter, uint256 id);
    error HashMismatch(address emitter, uint256 id, bytes32 reportedHash, bytes32 calculatedHash);
    error CallFailed(address emitter, uint256 id);

    constructor(IHashi _hashi, address _yaho) {
        hashi = _hashi;
        yaho = _yaho;
    }

    function executeMessagesFromOracles(
        uint256[] memory chainIds,
        Message[] memory messages,
        uint256[] memory messageIds,
        address[] memory senders,
        IOracleAdapter[] memory oracleAdapters
    ) public returns (bytes[] memory) {
        if (messages.length != senders.length || messages.length != messageIds.length)
            revert UnequalArrayLengths(address(this));
        bytes[] memory returnDatas = new bytes[](oracleAdapters.length);
        for (uint i = 0; i < messages.length - 1; i++) {
            uint256 id = messageIds[i];
            if (executed[id]) revert AlreadyExecuted(address(this), id);

            uint256 chainId = chainIds[i];
            Message memory message = messages[i];
            bytes32 reportedHash = hashi.getHash(chainId, id, oracleAdapters);
            bytes32 calculatedHash = calculateHash(chainId, id, yaho, senders[i], message);
            if (reportedHash != calculatedHash) revert HashMismatch(address(this), id, reportedHash, calculatedHash);

            (bool success, bytes memory returnData) = address(message.to).call(message.data);
            if (!success) revert CallFailed(address(this), id);
            returnDatas[i] = returnData;
            executed[id] = true;
            emit MessageIdExecuted(message.toChainId, bytes32(id));
        }
        return returnDatas;
    }

    function calculateHash(
        uint256 chainId,
        uint256 id,
        address origin,
        address sender,
        Message memory message
    ) public pure returns (bytes32 calculatedHash) {
        calculatedHash = keccak256(abi.encode(chainId, id, origin, sender, message));
    }
}
