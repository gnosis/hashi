// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "./IAMB.sol";
import "../IOracleAdapter.sol";

contract AMBAdapter {
    IAMB public amb;
    address public headerReporter;
    bytes32 public chainId;
    mapping(uint256 => bytes32) public headers;

    event HeaderStored(uint256 indexed blockNumber, bytes32 indexed blockHeader);

    error ArrayLengthMissmatch(address emitter);

    constructor(IAMB _amb, address _headerReporter, bytes32 _chainId) {
        amb = _amb;
        headerReporter = _headerReporter;
        chainId = _chainId;
    }

    /// @dev Check that the amb, chainId, and owner are valid.
    modifier onlyValid() {
        require(msg.sender == address(amb), "Unauthorized amb");
        require(amb.messageSourceChainId() == chainId, "Unauthorized chainId");
        require(amb.messageSender() == headerReporter, "Unauthorized headerReporter");
        _;
    }

    /// @dev Stores the block header for a given block.
    /// @param blockNumber Identifier for the block for which to set the header.
    /// @param newBlockHeader Header to set for the given block.
    /// @notice Only callable by `amb` with a message passed from `headerReporter.
    function storeBlockHeader(uint256 blockNumber, bytes32 newBlockHeader) public onlyValid {
        _storeBlockHeader(blockNumber, newBlockHeader);
    }

    /// @dev Stores the block headers for a given array of blocks.
    /// @param blockNumbers Array of block number for which to set the headers.
    /// @param newBlockHeaders Array of block headers to set for the given blocks.
    /// @notice Only callable by `amb` with a message passed from `headerReporter.
    /// @notice Will revert if given array lengths do not match.
    function storeBlockHeaders(uint256[] memory blockNumbers, bytes32[] memory newBlockHeaders) public onlyValid {
        if (blockNumbers.length != newBlockHeaders.length) revert ArrayLengthMissmatch(address(this));
        for (uint i = 0; i < blockNumbers.length; i++) {
            _storeBlockHeader(blockNumbers[i], newBlockHeaders[i]);
        }
    }

    function _storeBlockHeader(uint256 blockNumber, bytes32 newBlockHeader) internal {
        bytes32 currentBlockHeader = headers[blockNumber];
        if (currentBlockHeader != newBlockHeader) {
            headers[blockNumber] = newBlockHeader;
            emit HeaderStored(blockNumber, newBlockHeader);
        }
    }

    /// @dev Returns the block header for a given block, as reported by the AMB.
    /// @param blockNumber Identifier for the block to query.
    /// @return blockHeader Bytes32 block header reported by the oracle for the given block on the given chain.
    /// @notice MUST return bytes32(0) if the oracle has not yet reported a header for the given block.
    function getHeaderFromOracle(uint256, uint256 blockNumber) external view returns (bytes32 blockHeader) {
        blockHeader = headers[blockNumber];
    }
}
