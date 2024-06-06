// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.17;

contract MockSpectreRouter {
    event Deposit(
        uint8 destinationDomainID,
        uint8 securityModel,
        bytes32 resourceID,
        uint64 depositNonce,
        address indexed user,
        bytes data,
        bytes handlerResponse
    );

    function deposit(
        uint8 destinationDomainID,
        uint8 securityModel,
        bytes32 resourceID,
        bytes calldata depositData,
        bytes calldata feeData
    ) external payable returns (uint64 depositNonce) {
        uint64 depositNonce = 1;

        emit Deposit(destinationDomainID, securityModel, resourceID, depositNonce, msg.sender, depositData, feeData);
        return depositNonce;
    }
}
