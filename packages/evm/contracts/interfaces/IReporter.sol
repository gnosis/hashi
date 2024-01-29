// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IOracleAdapter } from "./IOracleAdapter.sol";

interface IReporter {
    event BlockDispatched(
        uint256 indexed toChainId,
        IOracleAdapter adapter,
        uint256 indexed blockNumber,
        bytes32 blockHeader
    );
    event MessageDispatched(
        uint256 indexed toChainId,
        IOracleAdapter adapter,
        uint256 indexed messageId,
        bytes32 messageHash
    );

    error NotYaho(address sender, address expectedYaho);

    function dispatchBlocks(
        uint256 toChainId,
        IOracleAdapter adapter,
        uint256[] memory blockNumbers
    ) external payable returns (bytes32);

    function dispatchMessages(
        uint256 toChainId,
        IOracleAdapter adapter,
        uint256[] memory messageIds,
        bytes32[] memory messageHashes
    ) external payable returns (bytes32);
}
