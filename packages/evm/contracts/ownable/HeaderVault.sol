// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IHeaderVault } from "../interfaces/IHeaderVault.sol";

contract HeaderVault is IHeaderVault, Ownable {
    mapping(uint256 => mapping(uint256 => bytes32)) private _blockHeaders;
    mapping(uint256 => address) _headerReporters;
    address public yaru;

    error NotYaru(address currentYaru, address expectedYaru);
    error InvalidHeaderReporter(uint256 fromChainId, address headerReporter, address expectedHeaderReporter);
    error UnequalArrayLengths();
    error YaruAlreadyInitialized(address yaru);

    modifier onlyYaruAndOnlyHeaderReporter(uint256 fromChainId, address from) {
        if (msg.sender != yaru) revert NotYaru(msg.sender, yaru);
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

    function initializeYaru(address yaru_) external onlyOwner {
        if (yaru == address(0)) revert YaruAlreadyInitialized(yaru);
        yaru = yaru_;
    }

    function onMessage(
        bytes calldata data,
        bytes32,
        uint256 fromChainId,
        address from
    ) external onlyYaruAndOnlyHeaderReporter(fromChainId, from) returns (bytes memory) {
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
