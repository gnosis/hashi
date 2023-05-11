// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity 0.8.17;

interface ILightClient {
    function currentIndex() external view returns (uint256);

    function optimisticHeaders(uint256 index) external view returns (bytes32);

    function optimisticSlots(uint256 index) external view returns (uint256);
}
