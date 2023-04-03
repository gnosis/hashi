// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { ILightClient, TelepathyStorage } from "./interfaces/ITelepathy.sol";
import { SSZ } from "./libraries/SimpleSerialize.sol";
import { BlockHashOracleAdapter } from "../BlockHashOracleAdapter.sol";

contract TelepathyAdapter is BlockHashOracleAdapter {
    error NoLightClientOnChain(uint32 chainId);
    error InconsistentLightClient(address lightClient);
    error BlockHeaderNotAvailable(uint256 slot);
    error InvalidBlockNumberProof();
    error InvalidBlockHashProof();

    /// @dev The Telepathy Router contains a mapping of chainIds to Light Clients.
    address public immutable telepathyRouter;

    constructor(address _telepathyRouter) {
        telepathyRouter = _telepathyRouter;
    }

    /// @notice Stores the block header for a given block only if it exists in the Telepathy
    ///         Light Client for the chainId.
    function storeBlockHeader(
        uint32 _chainId,
        uint64 _slot,
        uint256 _blockNumber,
        bytes32[] calldata _blockNumberProof,
        bytes32 _blockHash,
        bytes32[] calldata _blockHashProof
    ) external {
        ILightClient lightClient = TelepathyStorage(telepathyRouter).lightClients(_chainId);
        if (address(lightClient) == address(0)) {
            revert NoLightClientOnChain(_chainId);
        }
        if (!lightClient.consistent()) {
            revert InconsistentLightClient(address(lightClient));
        }

        bytes32 blockHeaderRoot = lightClient.headers(_slot);
        if (blockHeaderRoot == bytes32(0)) {
            revert BlockHeaderNotAvailable(_slot);
        }

        if (!SSZ.verifyBlockNumber(_blockNumber, _blockNumberProof, blockHeaderRoot)) {
            revert InvalidBlockNumberProof();
        }

        if (!SSZ.verifyBlockHash(_blockHash, _blockHashProof, blockHeaderRoot)) {
            revert InvalidBlockHashProof();
        }

        _storeHash(uint256(_chainId), _blockNumber, _blockHash);
    }
}
