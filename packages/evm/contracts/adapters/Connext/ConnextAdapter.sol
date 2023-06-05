// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IConnext } from "@connext/interfaces/core/IConnext.sol";
import { IXReceiver } from "@connext/interfaces/core/IXReceiver.sol";
import { OracleAdapter } from "../OracleAdapter.sol";
import { BlockHashOracleAdapter } from "../BlockHashOracleAdapter.sol";

contract ConnextAdapter is OracleAdapter, BlockHashOracleAdapter, IXReceiver {
    bytes32 public headerReporter;

    error InvalidInputs();
    error InvalidSource(address _originSender, uint32 _origin);

    mapping(uint32 => uint16) public domainToChainId;
    mapping(uint32 => address) public domainToSource;
    mapping(uint32 => address) public domainToConnext;

    constructor(
        address[] memory _connexts,
        uint32[] memory _originDomains,
        uint16[] memory _originChainIds,
        address[] memory _sources,
        bytes32 _headerReporter
    ) {
        headerReporter = _headerReporter;
        if (
            _originDomains.length != _connexts.length ||
            _originDomains.length != _originChainIds.length ||
            _originDomains.length != _sources.length
        ) {
            revert InvalidInputs();
        }
        for (uint256 i = 0; i < _originDomains.length; i++) {
            domainToChainId[_originDomains[i]] = _originChainIds[i];
            domainToSource[_originDomains[i]] = _sources[i];
            domainToConnext[_originDomains[i]] = address(_connexts[i]);
        }
    }

    /** @notice A modifier for authenticated calls.
     * This is an important security consideration. If the target contract
     * function should be authenticated, it must check three things:
     *    1) The originating call comes from the expected origin domain.
     *    2) The originating call comes from the expected source contract.
     *    3) The call to this contract comes from Connext.
     */
    modifier onlySource(address _originSender, uint32 _origin) {
        if (domainToSource[_origin] != _originSender || msg.sender != domainToConnext[_origin]) {
            revert InvalidSource(_originSender, _origin);
        }
        _;
    }

    /// @dev Stores the block header for a given block.
    /// @param _transferId Unique Identifier for the transfer.
    /// @param _amount Amount of tokens transferred (0 in this case).
    /// @param _asset Asset transferred (irrelevant).
    /// @param _originSender Address which originated the call on the origin chain.
    /// @param _origin Domain for the origin chain.
    /// @param _callData decodable calldata passed through the Connext bridge.
    /// @notice Only callable by `connext` with a message passed from `headerReporter.
    function xReceive(
        bytes32 _transferId, // solhint-disable-line
        uint256 _amount, // solhint-disable-line
        address _asset, // solhint-disable-line
        address _originSender,
        uint32 _origin,
        bytes memory _callData
    ) external onlySource(_originSender, _origin) returns (bytes memory) {
        // Unpack the _callData
        (uint256 blockNumber, bytes32 newBlockHeader) = abi.decode(_callData, (uint256, bytes32));
        _storeHash(uint256(domainToChainId[_origin]), blockNumber, newBlockHeader);
    }
}
