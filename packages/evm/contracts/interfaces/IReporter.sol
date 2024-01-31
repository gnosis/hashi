// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { IAdapter } from "./IAdapter.sol";

interface IReporter {
    event BlockDispatched(
        uint256 indexed toChainId,
        IAdapter adapter,
        uint256 indexed blockNumber,
        bytes32 blockHeader
    );
    event MessageDispatched(
        uint256 indexed toChainId,
        IAdapter adapter,
        uint256 indexed messageId,
        bytes32 messageHash
    );

    error NotYaho(address sender, address expectedYaho);

    /**
     * @dev Dispatches blocks to a given adapter on the target chaib.
     * @param toChainId - The target chain's Uint256 identifier.
     * @param adapter - The adapter instance to use.
     * @param blockNumbers - An array of Uint256 block numbers to dispatch.
     * @notice blockNumbers must include block numbers that are greater than or equal to (currentBlock - 256) due to EVM limitations.
     * @return result - The result returned by the adapter as bytes.
     */
    function dispatchBlocks(
        uint256 toChainId,
        IAdapter adapter,
        uint256[] memory blockNumbers
    ) external payable returns (bytes32);

    /**
     * @dev Dispatches messages to a target chain using the specified adapter.
     * @param toChainId - The target chain's Uint256 identifier.
     * @param adapter - The adapter instance to use.
     * @param messageIds - An array of Uint256 message identifiers.
     * @param messageHashes - An array of bytes32 message hashes.
     * @notice This function can be called only by Yaho
     * @return result - The result returned by the adapter as bytes.
     */
    function dispatchMessages(
        uint256 toChainId,
        IAdapter adapter,
        uint256[] memory messageIds,
        bytes32[] memory messageHashes
    ) external payable returns (bytes32);
}
