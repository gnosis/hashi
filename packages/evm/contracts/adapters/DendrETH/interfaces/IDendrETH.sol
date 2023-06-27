// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity 0.8.17;

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

    function optimisticHeaders(uint256 index) external view returns (bytes32);

    function optimisticHeaderRoot() external view returns (bytes32);

    function optimisticSlots(uint256 index) external view returns (uint256);

    function optimisticHeaderSlot() external view returns (uint256);

    function light_client_update(LightClientUpdate calldata update) external;
}
