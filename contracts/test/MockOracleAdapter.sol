// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "../adapters/IOracleAdapter.sol";

contract MockOracleAdapter is IOracleAdapter {
    mapping(uint256 => mapping(uint256 => bytes32)) public blockHeaders;

    error LengthMismatch(address emitter);

    function getHeaderFromOracle(uint256 chainId, uint256 blockNumber) external view returns (bytes32 blockHeader) {
        blockHeader = blockHeaders[chainId][blockNumber];
    }

    function setBlockHeaders(uint256 chainId, uint256[] memory blockNumbers, bytes32[] memory _blockHeaders) external {
        if (blockNumbers.length != _blockHeaders.length) revert LengthMismatch(address(this));
        for (uint i = 0; i < blockNumbers.length; i++) {
            blockHeaders[chainId][blockNumbers[i]] = _blockHeaders[i];
        }
    }
}
