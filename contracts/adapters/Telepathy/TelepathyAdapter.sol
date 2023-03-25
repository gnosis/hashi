// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { ITelepathyRouter, ITelepathyHandler } from "./ITelepathy.sol";
import "../OracleAdapter.sol";
import "../BlockHashOracleAdapter.sol";

contract TelepathyAdapter is OracleAdapter, BlockHashOracleAdapter, ITelepathyHandler {
    ITelepathyRouter public router;
    bytes32 public headerReporter;

    error InvalidInputs();
    error InvalidSource(address _originSender, uint32 _origin);

    mapping(uint32 => address) public chainIdToSource;

    constructor(
        ITelepathyRouter _router,
        uint32[] memory _originChainIds,
        address[] memory _sources,
        bytes32 _headerReporter
    ) {
        headerReporter = _headerReporter;
        router = _router;
        if (_originChainIds.length != _sources.length) {
            revert InvalidInputs();
        }
        for (uint256 i = 0; i < _originChainIds.length; i++) {
            chainIdToSource[_originChainIds[i]] = _sources[i];
        }
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
        _storeHash(uint256(_sourceChainId), blockNumber, newBlockHeader);
        return ITelepathyHandler.handleTelepathy.selector;
    }
}
