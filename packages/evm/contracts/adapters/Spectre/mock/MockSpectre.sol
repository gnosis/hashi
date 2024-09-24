// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

contract MockSpectre {
    mapping(uint256 => bytes32) public blockHeaderRoots;

    function setRoot(uint256 slot, bytes32 root) external {
        blockHeaderRoots[slot] = root;
    }
}
