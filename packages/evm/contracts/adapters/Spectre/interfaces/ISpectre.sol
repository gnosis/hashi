// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

interface ISpectre {
    function blockHeaderRoots(uint256 slot) external view returns (bytes32);
}
