// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { IYaru } from "./interfaces/IYaru.sol";
import { IHashi, IAdapter } from "./interfaces/IHashi.sol";
import { Message } from "./interfaces/IMessage.sol";
import { MessageIdCalculator } from "./utils/MessageIdCalculator.sol";
import { MessageHashCalculator } from "./utils/MessageHashCalculator.sol";
import { IJushin } from "./interfaces/IJushin.sol";

contract Yaru is IYaru, MessageIdCalculator, MessageHashCalculator, ReentrancyGuard {
    address public immutable HASHI;
    address public immutable YAHO;
    uint256 public immutable SOURCE_CHAIN_ID;

    mapping(uint256 => bool) public executed;

    constructor(address hashi, address yaho_, uint256 sourceChainId) {
        HASHI = hashi;
        YAHO = yaho_;
        SOURCE_CHAIN_ID = sourceChainId;
    }

    /// @inheritdoc IYaru
    function executeMessages(Message[] calldata messages) external nonReentrant returns (bytes[] memory) {
        bytes[] memory returnDatas = new bytes[](messages.length);
        for (uint256 i = 0; i < messages.length; ) {
            Message memory message = messages[i];

            bytes32 messageHash = calculateMessageHash(message);
            uint256 messageId = calculateMessageId(SOURCE_CHAIN_ID, YAHO, messageHash);

            if (message.toChainId != block.chainid) revert InvalidToChainId(message.toChainId, block.chainid);

            if (executed[messageId]) revert MessageIdAlreadyExecuted(messageId);
            executed[messageId] = true;

            if (
                !IHashi(HASHI).checkHashWithThresholdFromAdapters(
                    SOURCE_CHAIN_ID,
                    messageId,
                    message.threshold,
                    message.adapters
                )
            ) revert ThresholdNotMet();

            try IJushin(message.receiver).onMessage(SOURCE_CHAIN_ID, messageId, message.sender, message.data) returns (
                bytes memory returnData
            ) {
                returnDatas[i] = returnData;
            } catch {
                revert CallFailed();
            }

            emit MessageExecuted(messageId, message);

            unchecked {
                ++i;
            }
        }
        return returnDatas;
    }
}
