// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IJushinki } from "./IJushinki.sol";

interface IHeaderVault is IJushinki {
    event NewBlock(uint256 indexed fromChainId, uint256 indexed blockNumber, bytes32 blockHeader);
    event HeaderReporterEnabled(uint256 fromChainId, address headerReporter);
    event HeaderReporterDisabled(uint256 fromChainId, address headerReporter);

    error InvalidBlockHeaderLength(uint256 length);
    error InvalidBlockHeaderRLP();
    error ConflictingBlockHeader(uint256 blockNumber, bytes32 reportedBlockHash, bytes32 storedBlockHash);
    error NotYaru(address currentYaru, address expectedYaru);
    error InvalidHeaderReporter(uint256 fromChainId, address headerReporter, address expectedHeaderReporter);
    error UnequalArrayLengths();
    error YaruAlreadyInitialized(address yaru);

    function initializeYaru(address yaru_) external;

    function getBlockHeader(uint256 chainId, uint256 blockNumber) external view returns (bytes32);

    function proveAncestralBlockHashes(uint256 fromChainId, bytes[] memory blockHeaders) external;
}
