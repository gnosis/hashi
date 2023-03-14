// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "../adapters/OracleAdapter.sol";

contract MockOracleAdapter is OracleAdapter {
    error LengthMismatch(address emitter);

    function setBlockHeaders(uint256 chainId, uint256[] memory blockNumbers, bytes32[] memory _blockHeaders) external {
        if (blockNumbers.length != _blockHeaders.length) revert LengthMismatch(address(this));
        for (uint i = 0; i < blockNumbers.length; i++) {
            headers[chainId][blockNumbers[i]] = _blockHeaders[i];
        }
    }
}
