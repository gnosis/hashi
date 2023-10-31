// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.17;

import "../interfaces/IBridge.sol";

contract MockSygmaBridge {
    error CallReverted();

    event Deposit(
        uint8 destinationDomainID,
        bytes32 resourceID,
        uint64 depositNonce,
        address indexed user,
        bytes data,
        bytes handlerResponse
    );

    function deposit(
        uint8 destinationDomainID,
        bytes32 resourceID,
        bytes calldata depositData,
        bytes calldata feeData
    ) external payable returns (uint64 depositNonce, bytes memory handlerResponse) {
        emit Deposit(destinationDomainID, resourceID, 1, msg.sender, depositData, feeData);

        bool success = _executeProposal(resourceID, depositData);

        if (!success) revert CallReverted();

        return (1, bytes("2"));
    }

    function _executeProposal(bytes32 resourceID, bytes calldata data) internal returns (bool success) {
        uint16 lenExecuteFuncSignature;
        bytes4 executeFuncSignature;
        uint8 lenExecuteContractAddress;
        address executeContractAddress;
        uint8 lenExecutionDataDepositor;
        address executionDataDepositor;
        bytes memory executionData;

        lenExecuteFuncSignature = uint16(bytes2(data[32:34]));
        executeFuncSignature = bytes4(data[34:34 + lenExecuteFuncSignature]);
        lenExecuteContractAddress = uint8(bytes1(data[34 + lenExecuteFuncSignature:35 + lenExecuteFuncSignature]));
        executeContractAddress = address(
            uint160(
                bytes20(data[35 + lenExecuteFuncSignature:35 + lenExecuteFuncSignature + lenExecuteContractAddress])
            )
        );
        lenExecutionDataDepositor = uint8(
            bytes1(
                data[35 + lenExecuteFuncSignature + lenExecuteContractAddress:36 +
                    lenExecuteFuncSignature +
                    lenExecuteContractAddress]
            )
        );
        executionDataDepositor = address(
            uint160(
                bytes20(
                    data[36 + lenExecuteFuncSignature + lenExecuteContractAddress:36 +
                        lenExecuteFuncSignature +
                        lenExecuteContractAddress +
                        lenExecutionDataDepositor]
                )
            )
        );
        executionData = bytes(
            data[36 + lenExecuteFuncSignature + lenExecuteContractAddress + lenExecutionDataDepositor:]
        );

        bytes memory callData = abi.encodePacked(
            executeFuncSignature,
            abi.encode(executionDataDepositor),
            executionData
        );
        (success, ) = executeContractAddress.call(callData);
    }
}
