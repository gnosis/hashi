// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

struct LightClientUpdate {
    bytes32 attestedHeaderRoot;
    uint256 attestedHeaderSlot;
    bytes32 finalizedHeaderRoot;
    bytes32 finalizedExecutionStateRoot;
    uint256[2] a;
    uint256[2][2] b;
    uint256[2] c;
}

interface ILightClient {
    function currentIndex() external view returns (uint256);

    function optimisticHeaderRoot() external view returns (bytes32);

    function optimisticHeaderSlot() external view returns (uint256);

    function finalizedHeaderRoot() external view returns (bytes32);

    function executionStateRoot() external view returns (bytes32);

    function optimisticHeaders(uint256 index) external view returns (bytes32);

    function optimisticSlots(uint256 index) external view returns (uint256);

    function finalizedHeaders(uint256 index) external view returns (bytes32);

    function executionStateRoots(uint256 index) external view returns (bytes32);

    function lightClientUpdate(LightClientUpdate calldata update) external payable;
}
