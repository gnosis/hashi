// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { IHashi, IOracleAdapter } from "./interfaces/IHashi.sol";
import { Message } from "./interfaces/IMessage.sol";
import { IMessageExecutor } from "./interfaces/IMessageExecutor.sol";
import { MessageHashCalculator } from "./utils/MessageHashCalculator.sol";
import { IJushinki } from "./interfaces/IJushinki.sol";

contract Yaru is IMessageExecutor, MessageHashCalculator, ReentrancyGuard {
    IHashi public immutable hashi;
    mapping(bytes32 => bool) public executed;

    error UnequalArrayLengths(address emitter);
    error MessageIdAlreadyExecuted(bytes32 messageId);
    error MessageFailure(bytes32 messageId, bytes errorData);

    /// @param _hashi Address of the Hashi contract.
    constructor(IHashi _hashi) {
        hashi = _hashi;
    }

    /// @dev Executes messages validated by a given set of oracle adapters
    /// @param messages Array of messages to execute.
    /// @param messageIds Array of corresponding messageIds to query for hashes from the given oracle adapters.
    /// @param oracleAdapters Array of oracle adapters to query.
    /// @return returnDatas Array of data returned from each executed message.
    function executeMessages(
        Message[] memory messages,
        bytes32[] memory messageIds,
        IOracleAdapter[] memory oracleAdapters
    ) external nonReentrant returns (bytes[] memory) {
        if (messages.length != messageIds.length) revert UnequalArrayLengths(address(this));
        bytes[] memory returnDatas = new bytes[](messages.length);
        for (uint256 i = 0; i < messages.length; i++) {
            bytes32 messageId = messageIds[i];

            if (executed[messageId]) revert MessageIdAlreadyExecuted(messageId);
            executed[messageId] = true;

            Message memory message = messages[i];
            bytes32 reportedHash = hashi.getHash(message.fromChainId, messageId, oracleAdapters);
            bytes32 calculatedHash = calculateMessageHash(message);
            if (reportedHash != calculatedHash)
                revert MessageFailure(messageId, abi.encode(reportedHash, calculatedHash));

            try IJushinki(message.to).onMessage(message.data, messageId, message.fromChainId, message.from) returns (
                bytes memory returnData
            ) {
                returnDatas[i] = returnData;
            } catch {
                revert MessageFailure(messageId, abi.encode(0));
            }

            emit MessageIdExecuted(message.fromChainId, messageId);
        }
        return returnDatas;
    }
}
