// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

/**
    @title Interface for Router contract.
    @author ChainSafe Systems.
 */
interface IRouter {
    /**
        @notice Initiates a transfer using a specified handler contract.
        @notice Only callable when Bridge is not paused.
        @param destinationDomainID ID of chain deposit will be bridged to.
        @param securityModel Pointer to Specter Proxy contracts that will do the verification.
        @param resourceID ResourceID used to find address of handler to be used for deposit.
        @param depositData Additional data to be passed to specified handler.
        @param feeData Additional data to be passed to the fee handler.
        @notice Emits {Deposit} event with all necessary parameters.
     */
    function deposit(
        uint8 destinationDomainID,
        uint8 securityModel,
        bytes32 resourceID,
        bytes calldata depositData,
        bytes calldata feeData
    ) external payable returns (uint64 depositNonce);
}
