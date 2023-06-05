// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.17;

interface ISygmaAdapter {
    function storeHashes(address reporter, uint256[] memory ids, bytes32[] memory _hashes) external;
}
