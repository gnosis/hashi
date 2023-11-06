// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { IYaru } from "./interfaces/IYaru.sol";
import { IHashi, IOracleAdapter } from "./interfaces/IHashi.sol";
import { Message } from "./interfaces/IMessage.sol";
import { MessageHashCalculator } from "./utils/MessageHashCalculator.sol";
import { MessageIdCalculator } from "./utils/MessageIdCalculator.sol";
import { IJushinki } from "./interfaces/IJushinki.sol";

contract Yaru is IYaru, MessageHashCalculator, MessageIdCalculator, ReentrancyGuard, Ownable {
    address public immutable hashi;

    mapping(uint256 => address) private _yahos;
    mapping(bytes32 => bool) public executed;

    error UnequalArrayLengths(address emitter);
    error MessageIdAlreadyExecuted(bytes32 messageId);
    error MessageFailure(bytes32 messageId, bytes errorData);
    error AlreadyInitialized(uint256 chainId);

    /// @param hashi_ Address of the Hashi contract.
    constructor(address hashi_) {
        hashi = hashi_;
    }

    /// @dev Executes messages validated by a given set of oracle adapters
    /// @param messages Array of messages to execute.
    /// @param messageTypes Array of bytes32 corresponding to message types used to calculate the message ids.
    /// @param salts Array of bytes32 corresponding to the salts used to calculate the message ids.
    /// @return returnDatas Array of data returned from each executed message.
    function executeMessages(
        Message[] memory messages,
        bytes32[] memory messageTypes,
        bytes32[] memory salts,
        IOracleAdapter[] memory oracleAdapters
    ) external nonReentrant returns (bytes[] memory) {
        if (messages.length != messageTypes.length || messages.length != salts.length)
            revert UnequalArrayLengths(address(this));
        bytes[] memory returnDatas = new bytes[](messages.length);
        for (uint256 i = 0; i < messages.length; i++) {
            Message memory message = messages[i];
            bytes32 messageHash = calculateMessageHash(message);
            bytes32 messageId = calculateMessageId(
                message.fromChainId,
                _yahos[message.fromChainId],
                messageTypes[i],
                salts[i],
                messageHash
            );

            if (executed[messageId]) revert MessageIdAlreadyExecuted(messageId);
            executed[messageId] = true;

            bytes32 reportedHash = IHashi(hashi).getHash(message.fromChainId, messageId, oracleAdapters);
            if (reportedHash != messageHash) revert MessageFailure(messageId, abi.encode(reportedHash, messageHash));

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

    function initializeForChainId(uint256 chainId, address yaho) external onlyOwner {
        if (_yahos[chainId] != address(0)) revert AlreadyInitialized(chainId);
        _yahos[chainId] = yaho;
        emit Initialized(chainId, yaho);
    }
}
