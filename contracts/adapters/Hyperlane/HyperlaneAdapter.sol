// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageRecipient } from "./IHyperlane.sol";
import "../../interfaces/IOracleAdapter.sol";

contract HyperlaneAdapter is IMessageRecipient {
    bytes32 public headerReporter;
    mapping(uint256 => mapping(uint256 => bytes32)) public headers;

    event HeaderStored(uint256 indexed blockNumber, bytes32 indexed blockHeader);

    error InvalidInputs();
    error InvalidSource(address _originSender, uint32 _origin);

    mapping(uint32 => address) public chainIdToSource;
    mapping(uint32 => address) public chainIdToMailbox;

    constructor(
        address[] memory _mailboxes,
        uint32[] memory _originChainIds,
        address[] memory _sources,
        bytes32 _headerReporter
    ) {
        if (_originChainIds.length != _mailboxes.length || _originChainIds.length != _sources.length) {
            revert InvalidInputs();
        }
        for (uint256 i = 0; i < _originChainIds.length; i++) {
            chainIdToSource[_originChainIds[i]] = _sources[i];
            chainIdToMailbox[_originChainIds[i]] = _mailboxes[i];
        }
        headerReporter = _headerReporter;
    }

    modifier onlySource(address _originSender, uint32 _origin) {
        if (chainIdToSource[_origin] != _originSender || msg.sender != chainIdToMailbox[_origin]) {
            revert InvalidSource(_originSender, _origin);
        }
        _;
    }

    /// @dev Stores the block header for a given block.
    /// @param _origin ChainId of the origin chain.
    /// @param _sender Address which originated the call on the origin chain.
    /// @param _body decodable calldata passed through the Hyperlane bridge.
    /// @notice Only callable by `Hyperlane` with a message passed from `headerReporter`.
    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _body
    ) external onlySource(bytes32ToAddress(_sender), _origin) {
        (uint256 blockNumber, bytes32 newBlockHeader) = abi.decode(_body, (uint256, bytes32));
        bytes32 currentBlockHeader = headers[uint256(_origin)][blockNumber];
        if (currentBlockHeader != newBlockHeader) {
            headers[uint256(_origin)][blockNumber] = newBlockHeader;
            emit HeaderStored(blockNumber, newBlockHeader);
        }
    }

    /// @dev Returns the block header for a given block, as reported by Hyperlane.
    /// @param blockNumber Identifier for the block to query.
    /// @return blockHeader Bytes32 block header reported by the oracle for the given block on the given chain.
    /// @notice MUST return bytes32(0) if the oracle has not yet reported a header for the given block.
    function getHeaderFromOracle(uint256 chainId, uint256 blockNumber) external view returns (bytes32 blockHeader) {
        blockHeader = headers[chainId][blockNumber];
    }

    function bytes32ToAddress(bytes32 _buf) internal pure returns (address) {
        return address(uint160(uint256(_buf)));
    }
}
