// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IHeaderVault } from "../interfaces/IHeaderVault.sol";

contract HeaderVault is IHeaderVault, Ownable {
    error InvalidHeaderReporter(uint256 fromChainId, address headerReporter, address expectedHeaderReporter);
    error UnequalArrayLengths();

    mapping(uint256 => mapping(uint256 => bytes32)) private _blockHeaders;
    mapping(uint256 => address) _headerReporters;

    modifier onlyHeaderReporter(uint256 fromChainId, address from) {
        address expectedHeaderReporter = _headerReporters[fromChainId];
        if (expectedHeaderReporter != from) revert InvalidHeaderReporter(fromChainId, from, expectedHeaderReporter);
        _;
    }

    function disableBlockHeaderReporter(uint256 fromChainId) external onlyOwner {
        address headerReporter = _headerReporters[fromChainId];
        delete _headerReporters[fromChainId];
        emit HeaderReporterDisabled(fromChainId, headerReporter);
    }

    function enableBlockHeaderReporter(uint256 fromChainId, address headerReporter) external onlyOwner {
        _headerReporters[fromChainId] = headerReporter;
        emit HeaderReporterEnabled(fromChainId, headerReporter);
    }

    function getBlockHeader(uint256 chainId, uint256 blockNumber) external view returns (bytes32) {
        return _blockHeaders[chainId][blockNumber];
    }

    function onMessage(
        bytes calldata data,
        bytes32,
        uint256 fromChainId,
        address from
    ) external onlyHeaderReporter(fromChainId, from) returns (bytes memory) {
        (uint256[] memory blockNumbers, bytes32[] memory blockHeaders) = abi.decode(data, (uint256[], bytes32[]));
        if (blockNumbers.length != blockHeaders.length) revert UnequalArrayLengths();

        for (uint256 i = 0; i < blockNumbers.length; ) {
            uint256 blockNumber = blockNumbers[i];
            bytes32 blockHeader = blockHeaders[i];
            _blockHeaders[fromChainId][blockNumber] = blockHeader;
            emit NewBlock(fromChainId, blockNumber, blockHeader);
        }

        // TODO: what to return?
        return bytes(abi.encode(0));
    }
}
