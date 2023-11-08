// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IHeaderVault } from "../interfaces/IHeaderVault.sol";

contract HeaderVault is IHeaderVault, Ownable {
    mapping(uint256 => mapping(uint256 => bytes32)) private _blockHeaders;
    address public yaru;

    modifier onlyYaruAndOnlyHeaderReporter(uint256 fromChainId, address from) {
        if (msg.sender != yaru) revert NotYaru(msg.sender, yaru);
        if (from != address(0)) revert InvalidHeaderReporter(fromChainId, from, address(0));
        _;
    }

    function getBlockHeader(uint256 fromChainId, uint256 blockNumber) external view returns (bytes32) {
        return _blockHeaders[fromChainId][blockNumber];
    }

    function initializeYaru(address yaru_) external onlyOwner {
        if (yaru != address(0)) revert YaruAlreadyInitialized(yaru);
        yaru = yaru_;
    }

    function onMessage(
        bytes calldata data,
        bytes32,
        uint256 fromChainId,
        address from
    ) external onlyYaruAndOnlyHeaderReporter(fromChainId, from) returns (bytes memory) {
        (uint256 blockNumber, bytes32 blockHeader) = abi.decode(data, (uint256, bytes32));
        _blockHeaders[fromChainId][blockNumber] = blockHeader;
        emit NewBlock(fromChainId, blockNumber, blockHeader);
        return bytes(abi.encode(true));
    }
}
