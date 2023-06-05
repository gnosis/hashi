// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.17;

import "../interfaces/IBridge.sol";

contract MockSygmaBridge {
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
    ) external payable {
        emit Deposit(destinationDomainID, resourceID, 1, msg.sender, depositData, feeData);
    }
}
