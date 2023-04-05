// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

interface IAMB {
    function messageSender() external view returns (address);

    function messageSourceChainId() external view returns (bytes32);

    function requireToPassMessage(address _contract, bytes memory _data, uint256 _gas) external returns (bytes32);
}
