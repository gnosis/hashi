// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "./interfaces/IBridge.sol";
import "./interfaces/ISygmaAdapter.sol";
import "../../utils/HeaderStorage.sol";

contract SygmaHeaderReporter {
    IBridge public immutable _bridge;
    HeaderStorage public immutable _headerStorage;
    bytes32 public immutable _resourceID;
    uint8 public immutable _defaultDestinationDomainID;
    address public immutable _defaultSygmaAdapter;

    event HeaderReported(address indexed emitter, uint256 indexed blockNumber, bytes32 indexed blockHeader);

    constructor(
        IBridge bridge,
        HeaderStorage headerStorage,
        bytes32 resourceID,
        uint8 defaultDestinationDomainID,
        address defaultSygmaAdapter
    ) {
        _bridge = bridge;
        _headerStorage = headerStorage;
        _resourceID = resourceID;
        _defaultDestinationDomainID = defaultDestinationDomainID;
        _defaultSygmaAdapter = defaultSygmaAdapter;
    }

    /**
        @dev Reports the given block headers to the oracleAdapter via the Sygma bridge to default domain.
        @param blockNumbers Uint256 array of block numbers to pass over the Sygma bridge.
        @param feeData Additional data to be passed to the fee handler.
    */
    function reportHeaders(uint256[] memory blockNumbers, bytes calldata feeData) public payable {
        _reportHeaders(blockNumbers, _defaultSygmaAdapter, _defaultDestinationDomainID, feeData);
    }

    /**
        @dev Reports the given block headers to the oracleAdapter via the Sygma bridge to specified domain.
        @param blockNumbers Uint256 array of block numbers to pass over the Sygma bridge.
        @param sygmaAdapter Address of the Sygma adapter on the target chain.
        @param destinationDomainID Destination domain ID.
        @param feeData Additional data to be passed to the fee handler.
    */
    function reportHeadersToDomain(
        uint256[] memory blockNumbers,
        address sygmaAdapter,
        uint8 destinationDomainID,
        bytes calldata feeData
    ) public payable {
        _reportHeaders(blockNumbers, sygmaAdapter, destinationDomainID, feeData);
    }

    function _reportHeaders(
        uint256[] memory blockNumbers,
        address sygmaAdapter,
        uint8 destinationDomainID,
        bytes calldata feeData
    ) internal {
        bytes32[] memory blockHeaders = _headerStorage.storeBlockHeaders(blockNumbers);
        bytes memory depositData = abi.encodePacked(
            // uint256 maxFee
            uint256(0),
            // uint16 len(executeFuncSignature)
            uint16(4),
            // bytes executeFuncSignature
            ISygmaAdapter(address(0)).storeHashes.selector,
            // uint8 len(executeContractAddress)
            uint8(20),
            // bytes executeContractAddress
            sygmaAdapter,
            // uint8 len(executionDataDepositor)
            uint8(20),
            // bytes executionDataDepositor
            address(this),
            // bytes executionDataDepositor + executionData
            prepareDepositData(blockNumbers, blockHeaders)
        );
        IBridge(_bridge).deposit{ value: msg.value }(destinationDomainID, _resourceID, depositData, feeData);
        for (uint i = 0; i < blockNumbers.length; i++) {
            emit HeaderReported(address(this), blockNumbers[i], blockHeaders[i]);
        }
    }

    function slice(bytes calldata input, uint256 position) public pure returns (bytes memory) {
        return input[position:];
    }

    function prepareDepositData(
        uint256[] memory blockNumbers,
        bytes32[] memory blockHeaders
    ) public view returns (bytes memory) {
        bytes memory encoded = abi.encode(address(0), blockNumbers, blockHeaders);
        return this.slice(encoded, 32);
    }
}
