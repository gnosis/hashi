// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IReporter } from "../interfaces/IReporter.sol";
import { IOracleAdapter } from "../interfaces/IOracleAdapter.sol";

contract MockReporter is IReporter {
    address public immutable YAHO;

    error NotYaho();

    event MessageReported(uint256 toChainId, IOracleAdapter adapter, uint256 messageId, bytes32 messageHash);

    modifier onlyYaho() {
        if (msg.sender != YAHO) revert NotYaho();
        _;
    }

    constructor(address yaho) {
        YAHO = yaho;
    }

    function dispatchBlocks(
        uint256 toChainId,
        IOracleAdapter adapter,
        uint256[] memory blockNumbers,
        bytes32[] memory blockHeaders
    ) external returns (bytes32) {}

    function dispatchMessages(
        uint256 toChainId,
        IOracleAdapter adapter,
        uint256[] memory messageIds,
        bytes32[] memory messageHashes
    ) external onlyYaho returns (bytes32) {
        // _sendPayload(abi.encode(messageIds, messageHashes));
        for (uint256 i = 0; i < messageIds.length; i++) {
            emit MessageReported(toChainId, adapter, messageIds[i], messageHashes[i]);
        }
        return (bytes32(0));
    }
}
