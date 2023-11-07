// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageDispatcher, Message } from "./IMessageDispatcher.sol";

interface IYaho is IMessageDispatcher {
    function dispatchMessage(uint256 toChainId, address to, bytes calldata data) external returns (bytes32 messageId);

    error NoMessageIdsGiven(address emitter);
    error NoMessageRelaysGiven(address emitter);
    error NoAdaptersGiven(address emitter);
    error UnequalArrayLengths(address emitter);
    error MessageHashMismatch(bytes32 messageHash, bytes32 expectedMessageHash);

    function dispatchMessages(
        uint256[] calldata toChainIds,
        address[] calldata tos,
        bytes calldata data
    ) external returns (bytes32[] memory);

    function dispatchMessages(
        uint256[] calldata toChainIds,
        address[] calldata tos,
        bytes[] calldata data
    ) external returns (bytes32[] memory);

    function relayMessagesToAdapters(
        Message[] calldata messages,
        bytes32[] calldata messageIds,
        address[] calldata adapters,
        address[] calldata destinationAdapters
    ) external payable returns (bytes32[] memory);

    function dispatchMessagesToAdapters(
        uint256[] calldata toChainIds,
        address[] calldata tos,
        bytes calldata data,
        address[] calldata adapters,
        address[] calldata destinationAdapters
    ) external payable returns (bytes32[] memory, bytes32[] memory);

    function dispatchMessagesToAdapters(
        uint256[] calldata toChainIds,
        address[] calldata tos,
        bytes[] calldata data,
        address[] calldata adapters,
        address[] calldata destinationAdapters
    ) external payable returns (bytes32[] memory, bytes32[] memory);
}
