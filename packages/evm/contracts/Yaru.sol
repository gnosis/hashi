// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IHashi, IOracleAdapter } from "./interfaces/IHashi.sol";
import { Message } from "./interfaces/IMessage.sol";
import { IMessageExecutor } from "./interfaces/IMessageExecutor.sol";
import { MessageHashCalculator } from "./utils/MessageHashCalculator.sol";

contract Yaru is IMessageExecutor, MessageHashCalculator {
    IHashi public immutable hashi;
    address public immutable yaho;
    uint256 public immutable chainId;
    mapping(uint256 => bool) public executed;
    address public sender;

    error ReentranceNotAllowed(address);
    error UnequalArrayLengths(address emitter);
    error AlreadyExecuted(address emitter, uint256 id);
    error InvalidSender(address emitter, address sender);
    error HashMismatch(address emitter, uint256 id, bytes32 reportedHash, bytes32 calculatedHash);
    error CallFailed(address emitter, uint256 id);

    /// @param _hashi Address of the Hashi contract.
    /// @param _yaho Address of the Yaho contract
    constructor(IHashi _hashi, address _yaho, uint256 _chainId) {
        hashi = _hashi;
        yaho = _yaho;
        chainId = _chainId;
    }

    /// @dev Executes messages validated by a given set of oracle adapters
    /// @param messages Array of messages to execute.
    /// @param messageIds Array of corresponding messageIds to query for hashes from the given oracle adapters.
    /// @param senders Array of addresses that sent the corresponding messages.
    /// @param oracleAdapters Array of oracle adapters to query.
    /// @return returnDatas Array of data returned from each executed message.
    function executeMessages(
        Message[] memory messages,
        uint256[] memory messageIds,
        address[] memory senders,
        IOracleAdapter[] memory oracleAdapters
    ) public returns (bytes[] memory) {
        if (sender != address(0)) revert ReentranceNotAllowed(address(0));
        if (messages.length != senders.length || messages.length != messageIds.length)
            revert UnequalArrayLengths(address(this));
        bytes[] memory returnDatas = new bytes[](messages.length);
        for (uint256 i = 0; i < messages.length; i++) {
            uint256 id = messageIds[i];

            if (executed[id]) revert AlreadyExecuted(address(this), id);
            if (senders[i] == address(0)) revert InvalidSender(address(this), senders[i]);

            executed[id] = true;

            Message memory message = messages[i];
            sender = senders[i];
            bytes32 reportedHash = hashi.getHash(chainId, id, oracleAdapters);
            bytes32 calculatedHash = calculateHash(chainId, id, yaho, sender, message);
            if (reportedHash != calculatedHash) revert HashMismatch(address(this), id, reportedHash, calculatedHash);

            (bool success, bytes memory returnData) = address(message.to).call(message.data);
            if (!success) revert CallFailed(address(this), id);

            delete sender;
            returnDatas[i] = returnData;
            emit MessageIdExecuted(message.toChainId, bytes32(id));
        }
        return returnDatas;
    }
}
