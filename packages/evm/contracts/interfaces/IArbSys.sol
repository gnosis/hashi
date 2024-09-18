// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

interface IArbSys {
    /**
     * @notice Get Arbitrum block hash (reverts unless currentBlockNum-256 <= arbBlockNum < currentBlockNum)
     * @return block hash
     */
    function arbBlockHash(uint256 arbBlockNum) external view returns (bytes32);
}
