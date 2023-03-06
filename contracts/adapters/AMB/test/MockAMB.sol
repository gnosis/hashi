// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "../IAMB.sol";
import "../AMBAdapter.sol";

contract MockAMB is IAMB {
    address private sender;
    bytes32 immutable chainId = 0x0000000000000000000000000000000000000000000000000000000000000064;

    error TransactionFailed();

    function messageSender() external view returns (address) {
        return sender;
    }

    function messageSourceChainId() external view returns (bytes32) {
        return chainId;
    }

    function requireToPassMessage(address _contract, bytes memory _data, uint256 gas) external returns (bytes32) {
        sender = msg.sender;
        (bool success, bytes memory returnData) = _contract.call(_data);
        if (!success) revert TransactionFailed();
        delete sender;
        return keccak256(returnData);
    }
}
