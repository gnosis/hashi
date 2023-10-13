// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "./interfaces/ISygmaAdapter.sol";
import "./interfaces/IBridge.sol";

contract SygmaReporter {
    address public immutable _bridge;
    bytes32 public immutable _resourceID;
    uint8 public immutable _defaultDestinationDomainID;
    address public immutable _defaultSygmaAdapter;

    constructor(address bridge, bytes32 resourceID, uint8 defaultDestinationDomainID, address defaultSygmaAdapter) {
        _bridge = bridge;
        _resourceID = resourceID;
        _defaultDestinationDomainID = defaultDestinationDomainID;
        _defaultSygmaAdapter = defaultSygmaAdapter;
    }

    function _reportData(
        uint256[] memory messageIds,
        bytes32[] memory hashes,
        address sygmaAdapter,
        uint8 destinationDomainID,
        bytes memory feeData
    ) internal returns (uint64 depositNonce, bytes memory handlerResponse) {
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
            prepareDepositData(messageIds, hashes)
        );
        return IBridge(_bridge).deposit{ value: msg.value }(destinationDomainID, _resourceID, depositData, feeData);
    }

    function slice(bytes calldata input, uint256 position) public pure returns (bytes memory) {
        return input[position:];
    }

    function prepareDepositData(
        uint256[] memory messageIds,
        bytes32[] memory hashes
    ) public view returns (bytes memory) {
        bytes memory encoded = abi.encode(address(0), messageIds, hashes);
        return this.slice(encoded, 32);
    }
}
