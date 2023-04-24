// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IAMB } from "../IAMB.sol";
import { AMBAdapter } from "../AMBAdapter.sol";

contract MockAMB is IAMB {
    address private sender;
    bytes32 private immutable chainId = 0x0000000000000000000000000000000000000000000000000000000000007A69;

    event MessagePassed(address sender, bytes data);

    error TransactionFailed();

    function messageSender() external view returns (address) {
        return sender;
    }

    function messageSourceChainId() external pure returns (bytes32) {
        return chainId;
    }

    function requireToPassMessage(address _contract, bytes memory _data, uint256) external returns (bytes32) {
        sender = msg.sender;
        (bool success, bytes memory returnData) = _contract.call(_data);
        if (!success) revert TransactionFailed();
        emit MessagePassed(sender, _data);
        delete sender;
        return keccak256(returnData);
    }
}
