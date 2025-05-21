// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IDarwiniaRouter, ILightClient } from "./interfaces/IDarwinia.sol";
import { BlockHashOracleAdapter } from "../BlockHashOracleAdapter.sol";

contract DarwiniaAdapter is BlockHashOracleAdapter {
    error NoLightClientOnChain(uint256 chainId);
    error BlockHeaderNotAvailable(uint256 blockNumber);

    /// @dev The Darwinia Router contains a mapping of ChainIds to Light Clients.
    address public immutable router;

    constructor(address _router) {
        router = _router;
    }

    /// @dev Stores the block header for a given block only if it is imported in the Darwinia Light Client
    /// @param chainId Identifier for the chain to fetch header hash
    /// @param blockNumber Block number for the block for which to store the header hash.
    function storeBlockHeader(uint256 chainId, uint256 blockNumber) external {
        ILightClient lightClient = IDarwiniaRouter(router).lightClientOf(chainId);
        if (address(lightClient) == address(0)) {
            revert NoLightClientOnChain(chainId);
        }
        bytes32 blockHeadHash = lightClient.headerOf(blockNumber);
        if (blockHeadHash == bytes32(0)) {
            revert BlockHeaderNotAvailable(blockNumber);
        }
        _storeHash(chainId, blockNumber, blockHeadHash);
    }
}
