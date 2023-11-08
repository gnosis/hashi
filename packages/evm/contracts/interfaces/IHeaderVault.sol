// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IJushinki } from "./IJushinki.sol";

interface IHeaderVault is IJushinki {
    event NewBlock(uint256 indexed fromChainId, uint256 indexed blockNumber, bytes32 blockHeader);

    error NotYaru(address currentYaru, address expectedYaru);
    error InvalidHeaderReporter(uint256 fromChainId, address headerReporter, address expectedHeaderReporter);
    error YaruAlreadyInitialized(address yaru);

    function initializeYaru(address yaru_) external;

    function getBlockHeader(uint256 chainId, uint256 blockNumber) external view returns (bytes32);
}
