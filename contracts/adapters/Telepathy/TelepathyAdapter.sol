// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { ITelepathyRouter, ITelepathyHandler } from "./ITelepathy.sol";
import "../../interfaces/IOracleAdapter.sol";

contract TelepathyAdapter is ITelepathyHandler {
    ITelepathyRouter public router;
    bytes32 public headerReporter;
    mapping(uint256 => mapping(uint256 => bytes32)) public headers;

    event HeaderStored(uint256 indexed blockNumber, bytes32 indexed blockHeader);

    error InvalidInputs();
    error InvalidSource(address _originSender, uint32 _origin);

    mapping(uint32 => address) public chainIdToSource;

    constructor(
        ITelepathyRouter _router,
        uint32[] memory _originChainIds,
        address[] memory _sources,
        bytes32 _headerReporter
    ) {
        router = _router;
        if (_originChainIds.length != _sources.length) {
            revert InvalidInputs();
        }
        for (uint256 i = 0; i < _originChainIds.length; i++) {
            chainIdToSource[_originChainIds[i]] = _sources[i];
        }
        headerReporter = _headerReporter;
    }

    modifier onlySource(address _senderAddress, uint32 _sourceChainId) {
        if (chainIdToSource[_sourceChainId] != _senderAddress || msg.sender != address(router)) {
            revert InvalidSource(_senderAddress, _sourceChainId);
        }
        _;
    }

    /// @dev Stores the block header for a given block.
    /// @param _sourceChainId ChainId of the origin chain.
    /// @param _senderAddress Address which originated the call on the origin chain.
    /// @param _data decodable calldata passed through the Telepathy bridge.
    /// @notice Only callable by `telepathy` with a message passed from `headerReporter`.
    function handleTelepathy(
        uint32 _sourceChainId,
        address _senderAddress,
        bytes memory _data
    ) external onlySource(_senderAddress, _sourceChainId) returns (bytes4) {
        (uint256 blockNumber, bytes32 newBlockHeader) = abi.decode(_data, (uint256, bytes32));
        bytes32 currentBlockHeader = headers[uint256(_sourceChainId)][blockNumber];
        if (currentBlockHeader != newBlockHeader) {
            headers[uint256(_sourceChainId)][blockNumber] = newBlockHeader;
            emit HeaderStored(blockNumber, newBlockHeader);
        }
        return ITelepathyHandler.handleTelepathy.selector;
    }

    /// @dev Returns the block header for a given block, as reported by Telepathy
    /// @param blockNumber Identifier for the block to query.
    /// @return blockHeader Bytes32 block header reported by the oracle for the given block on the given chain.
    /// @notice MUST return bytes32(0) if the oracle has not yet reported a header for the given block.
    function getHeaderFromOracle(uint256 chainId, uint256 blockNumber) external view returns (bytes32 blockHeader) {
        blockHeader = headers[chainId][blockNumber];
    }
}
