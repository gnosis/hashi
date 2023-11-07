// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { RLPReader } from "solidity-rlp/contracts/RLPReader.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IHeaderVault } from "../interfaces/IHeaderVault.sol";

contract HeaderVault is IHeaderVault, Ownable {
    using RLPReader for RLPReader.RLPItem;

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
        (uint256[] memory blockNumbers, bytes32[] memory blockHeaders) = abi.decode(data, (uint256[], bytes32[]));
        if (blockNumbers.length != blockHeaders.length) revert UnequalArrayLengths();

        for (uint256 i = 0; i < blockNumbers.length; ) {
            uint256 blockNumber = blockNumbers[i];
            bytes32 blockHeader = blockHeaders[i];
            _blockHeaders[fromChainId][blockNumber] = blockHeader;
            emit NewBlock(fromChainId, blockNumber, blockHeader);
            unchecked {
                ++i;
            }
        }

        return bytes(abi.encode(true));
    }

    function proveAncestralBlockHashes(uint256 fromChainId, bytes[] memory blockHeaders) external {
        for (uint256 i = 0; i < blockHeaders.length; i++) {
            RLPReader.RLPItem memory blockHeaderRLP = RLPReader.toRlpItem(blockHeaders[i]);

            if (!blockHeaderRLP.isList()) revert InvalidBlockHeaderRLP();

            RLPReader.RLPItem[] memory blockHeaderContent = blockHeaderRLP.toList();

            // NOTE: A block header should have between 15 and 17 elements (baseFee and withdrawalsRoot have been added later)
            if (blockHeaderContent.length < 15 || blockHeaderContent.length > 17)
                revert InvalidBlockHeaderLength(blockHeaderContent.length);

            bytes32 blockParent = bytes32(blockHeaderContent[0].toUint());
            uint256 blockNumber = uint256(blockHeaderContent[8].toUint());

            bytes32 reportedBlockHash = keccak256(blockHeaders[i]);
            bytes32 storedBlockHash = _blockHeaders[fromChainId][blockNumber];

            if (reportedBlockHash != storedBlockHash)
                revert ConflictingBlockHeader(blockNumber, reportedBlockHash, storedBlockHash);

            _blockHeaders[fromChainId][blockNumber - 1] = blockParent;
            emit NewBlock(fromChainId, blockNumber - 1, blockParent);
        }
    }
}
