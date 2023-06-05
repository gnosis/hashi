// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.17;

/**
    @title Interface for Bridge contract.
    @author ChainSafe Systems.
 */
interface IBridge {
    /**
        @notice Initiates a transfer using a specified handler contract.
        @notice Only callable when Bridge is not paused.
        @param destinationDomainID ID of chain deposit will be bridged to.
        @param resourceID ResourceID used to find address of handler to be used for deposit.
        @param depositData Additional data to be passed to specified handler.
        @param feeData Additional data to be passed to the fee handler.
        @notice Emits {Deposit} event with all necessary parameters.
     */
    function deposit(
        uint8 destinationDomainID,
        bytes32 resourceID,
        bytes calldata depositData,
        bytes calldata feeData
    ) external payable;
}
