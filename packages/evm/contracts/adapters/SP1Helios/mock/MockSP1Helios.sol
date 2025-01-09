// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

/// @title MockSP1Helios
/// @notice A mock Ethereum beacon chain light client, built with SP1 and Helios.
contract MockSP1Helios {
    /// @notice The latest slot the light client has a finalized header for.
    uint256 public head = 0;

    /// @notice Maps from a slot to a beacon block header root.
    mapping(uint256 => bytes32) public headers;

    event HeadUpdate(uint256 indexed slot, bytes32 indexed root);

    function setHeader(uint256 slot, bytes32 header) external {
        head = slot;
        headers[slot] = header;

        emit HeadUpdate(slot, header);
    }
}
