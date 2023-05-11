// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

interface IDarwiniaRouter {
    /// @dev Fetch Light Client contract addrees by chain id
    /// @param chainId Chain Id of the light client contract address to fetch
    /// @return Light Client contract address
    function lightClientOf(uint256 chainId) external view returns(address);
}

interface ILightClient {
    /// @dev Fetch block hash of the block number
    /// @param blockNumber Block number of the block hash to fetch
    /// @return block header hash
    function headerOf(uint256 blockNumber) external view returns (bytes32)
}


