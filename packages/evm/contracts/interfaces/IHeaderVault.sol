// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IJushinki } from "./IJushinki.sol";

interface IHeaderVault is IJushinki {
    event NewBlock(uint256 indexed fromChainId, uint256 indexed blockNumber, bytes32 blockHeader);
    event HeaderReporterEnabled(uint256 fromChainId, address headerReporter);
    event HeaderReporterDisabled(uint256 fromChainId, address headerReporter);

    function initializeYaru(address yaru_) external;

    function getBlockHeader(uint256 chainId, uint256 blockNumber) external view returns (bytes32);
}
