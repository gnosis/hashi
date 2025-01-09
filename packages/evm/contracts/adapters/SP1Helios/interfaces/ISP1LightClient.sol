// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface ISP1LightClient {
    function head() external view returns (uint256);
    function headers(uint256) external view returns (bytes32);
}
