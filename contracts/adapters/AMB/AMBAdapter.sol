// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "./IAMB.sol";
import "../OracleAdapter.sol";

contract AMBAdapter is OracleAdapter {
    IAMB public amb;
    address public headerReporter;
    bytes32 public chainId;

    event HeaderStored(uint256 indexed blockNumber, bytes32 indexed blockHeader);

    error ArrayLengthMissmatch(address emitter);
    error UnauthorizedAMB(address emitter, address sender);
    error UnauthorizedChainId(address emitter, bytes32 chainId);
    error UnauthorizedHeaderReporter(address emitter, address headerReporter);

    constructor(IAMB _amb, address _headerReporter, bytes32 _chainId) {
        amb = _amb;
        headerReporter = _headerReporter;
        chainId = _chainId;
    }

    /// @dev Check that the amb, chainId, and owner are valid.
    modifier onlyValid() {
        if (msg.sender != address(amb)) revert UnauthorizedAMB(address(this), msg.sender);
        if (amb.messageSourceChainId() != chainId) revert UnauthorizedChainId(address(this), chainId);
        if (amb.messageSender() != headerReporter) revert UnauthorizedHeaderReporter(address(this), headerReporter);
        _;
    }

    /// @dev Stores the block header for a given block.
    /// @param blockNumber Identifier for the block for which to set the header.
    /// @param blockHeader Header to set for the given block.
    /// @notice Only callable by `amb` with a message passed from `headerReporter.
    function storeBlockHeader(uint256 blockNumber, bytes32 blockHeader) public {
        _storeBlockHeader(blockNumber, blockHeader);
    }

    /// @dev Stores the block headers for a given array of blocks.
    /// @param blockNumbers Array of block number for which to set the headers.
    /// @param blockHeaders Array of block headers to set for the given blocks.
    /// @notice Only callable by `amb` with a message passed from `headerReporter.
    /// @notice Will revert if given array lengths do not match.
    function storeBlockHeaders(uint256[] memory blockNumbers, bytes32[] memory blockHeaders) public {
        if (blockNumbers.length != blockHeaders.length) revert ArrayLengthMissmatch(address(this));
        for (uint i = 0; i < blockNumbers.length; i++) {
            _storeBlockHeader(blockNumbers[i], blockHeaders[i]);
        }
    }

    function _storeBlockHeader(uint256 blockNumber, bytes32 blockHeader) internal onlyValid {
        bytes32 currentBlockHeader = headers[uint256(chainId)][blockNumber];
        if (currentBlockHeader != blockHeader) {
            headers[uint256(chainId)][blockNumber] = blockHeader;
            emit HeaderStored(blockNumber, blockHeader);
        }
    }
}
