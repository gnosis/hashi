// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IOracleAdapter } from "./IOracleAdapter.sol";

interface IReporter {
    function dispatchBlocks(
        uint256 toChainId,
        IOracleAdapter adapter,
        uint256[] memory blockNumbers,
        bytes32[] memory blockHeaders
    ) external returns (bytes32);

    function dispatchMessages(
        uint256 toChainId,
        IOracleAdapter adapter,
        uint256[] memory messageIds,
        bytes32[] memory messageHashes
    ) external returns (bytes32);
}
