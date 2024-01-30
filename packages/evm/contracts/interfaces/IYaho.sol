// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageDispatcher, Message } from "./IMessageDispatcher.sol";

interface IYaho is IMessageDispatcher {
    error NoMessagesGiven(address emitter);
    error NoMessageIdsGiven(address emitter);
    error NoAdaptersGiven(address emitter);
    error UnequalArrayLengths(address emitter);

    function dispatchMessages(Message[] memory messages) external payable returns (bytes32[] memory);

    function relayMessagesToAdapters(
        uint256[] memory messageIds,
        address[] memory adapters,
        address[] memory destinationAdapters
    ) external payable returns (bytes32[] memory);

    function dispatchMessagesToAdapters(
        Message[] memory messages,
        address[] memory adapters,
        address[] memory destinationAdapters
    ) external payable returns (bytes32[] memory messageIds, bytes32[] memory);

    function hashes(uint256) external view returns (bytes32);
}
