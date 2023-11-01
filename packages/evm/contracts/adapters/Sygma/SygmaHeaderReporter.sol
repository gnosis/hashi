// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { SygmaReporter } from "./SygmaReporter.sol";
import { HeaderStorage } from "../../utils/HeaderStorage.sol";

contract SygmaHeaderReporter is SygmaReporter {
    HeaderStorage public immutable _headerStorage;

    event HeaderReported(address indexed emitter, uint256 indexed blockNumber, bytes32 indexed blockHeader);

    constructor(
        address bridge,
        HeaderStorage headerStorage,
        bytes32 resourceID,
        uint8 defaultDestinationDomainID,
        address defaultSygmaAdapter
    ) SygmaReporter(bridge, resourceID, defaultDestinationDomainID, defaultSygmaAdapter) {
        _headerStorage = headerStorage;
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
        bytes memory feeData
    ) public payable {
        _reportHeaders(blockNumbers, sygmaAdapter, destinationDomainID, feeData);
    }

    function _reportHeaders(
        uint256[] memory blockNumbers,
        address sygmaAdapter,
        uint8 destinationDomainID,
        bytes memory feeData
    ) internal {
        bytes32[] memory blockHeaders = _headerStorage.storeBlockHeaders(blockNumbers);
        bytes32[] memory bBlockNumbers = new bytes32[](blockNumbers.length);
        for (uint256 i = 0; i < blockNumbers.length; ) {
            bBlockNumbers[i] = bytes32(blockNumbers[i]);
            unchecked {
                ++i;
            }
        }
        _reportData(bBlockNumbers, blockHeaders, sygmaAdapter, destinationDomainID, feeData);
        for (uint i = 0; i < blockNumbers.length; ) {
            emit HeaderReported(address(this), blockNumbers[i], blockHeaders[i]);
            unchecked {
                ++i;
            }
        }
    }
}
