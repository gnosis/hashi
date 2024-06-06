// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "./interfaces/IRouter.sol";
import "./interfaces/ISpectreAdapter.sol";
import "../../utils/HeaderStorage.sol";

contract SpectreHeaderReporter {
    IRouter public immutable _router;
    HeaderStorage public immutable _headerStorage;
    bytes32 public immutable _resourceID;
    uint8 public immutable _defaultDestinationDomainID;
    uint8 public immutable _defaultSecurityModel;
    address public immutable _defaultSpectreAdapter;

    event HeaderReported(address indexed emitter, uint256 indexed blockNumber, bytes32 indexed blockHeader);

    constructor(
        IRouter router,
        HeaderStorage headerStorage,
        bytes32 resourceID,
        uint8 defaultDestinationDomainID,
        uint8 defaultSecurityModel,
        address defaultSpectreAdapter
    ) {
        _router = router;
        _headerStorage = headerStorage;
        _resourceID = resourceID;
        _defaultDestinationDomainID = defaultDestinationDomainID;
        _defaultSpectreAdapter = defaultSpectreAdapter;
        _defaultSecurityModel = defaultSecurityModel;
    }

    /**
        @dev Reports the given block headers to the oracleAdapter via the Spectre router to default domain.
        @param blockNumbers Uint256 array of block numbers to pass over the Spectre router.
        @param feeData Additional data to be passed to the fee handler.
    */
    function reportHeaders(uint256[] memory blockNumbers, bytes calldata feeData) public payable {
        _reportHeaders(
            blockNumbers,
            _defaultSpectreAdapter,
            _defaultDestinationDomainID,
            _defaultSecurityModel,
            feeData
        );
    }

    /**
        @dev Reports the given block headers to the oracleAdapter via the Spectre router to specified domain.
        @param blockNumbers Uint256 array of block numbers to pass over the Spectre router.
        @param spectreAdapter Address of the Spectre adapter on the target chain.
        @param destinationDomainID Destination domain ID.
        @param feeData Additional data to be passed to the fee handler.
    */
    function reportHeadersToDomain(
        uint256[] memory blockNumbers,
        address spectreAdapter,
        uint8 destinationDomainID,
        uint8 securityModel,
        bytes calldata feeData
    ) public payable {
        _reportHeaders(blockNumbers, spectreAdapter, destinationDomainID, securityModel, feeData);
    }

    function _reportHeaders(
        uint256[] memory blockNumbers,
        address spectreAdapter,
        uint8 destinationDomainID,
        uint8 securityModel,
        bytes calldata feeData
    ) internal {
        bytes32[] memory blockHeaders = _headerStorage.storeBlockHeaders(blockNumbers);
        bytes memory depositData = abi.encodePacked(
            // uint256 maxFee
            uint256(950000),
            // uint16 len(executeFuncSignature)
            uint16(4),
            // bytes executeFuncSignature
            ISpectreAdapter(address(0)).storeHashes.selector,
            // uint8 len(executeContractAddress)
            uint8(20),
            // bytes executeContractAddress
            spectreAdapter,
            // uint8 len(executionDataDepositor)
            uint8(20),
            // bytes executionDataDepositor
            address(this),
            // bytes executionDataDepositor + executionData
            prepareDepositData(blockNumbers, blockHeaders)
        );
        _router.deposit{ value: msg.value }(destinationDomainID, securityModel, _resourceID, depositData, feeData);
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
