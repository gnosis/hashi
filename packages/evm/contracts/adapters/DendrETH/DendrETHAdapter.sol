// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { ILightClient, LightClientUpdate } from "./interfaces/IDendrETH.sol";
import { SSZ } from "../Telepathy/libraries/SimpleSerialize.sol";
import { BlockHashAdapter } from "../BlockHashAdapter.sol";

contract DendrETHAdapter is BlockHashAdapter {
    uint256 public immutable SOURCE_CHAIN_ID;
    address public immutable DENDRETH;

    error InvalidUpdate();
    error BlockHeaderNotAvailable(uint256 slot);
    error InvalidBlockNumberProof();
    error InvalidBlockHashProof();

    constructor(uint256 sourceChainId, address dendreth) {
        SOURCE_CHAIN_ID = sourceChainId;
        DENDRETH = dendreth;
    }

    /// @notice Stores the block header for a given block only if it exists
    //          in the DendrETH Light Client for the SOURCE_CHAIN_ID.
    function storeBlockHeader(
        uint64 slot,
        uint256 blockNumber,
        bytes32[] calldata blockNumberProof,
        bytes32 blockHash,
        bytes32[] calldata blockHashProof
    ) external {
        ILightClient lightClient = ILightClient(DENDRETH);

        uint256 currentIndex = lightClient.currentIndex();
        uint256 i = currentIndex;
        bool found = false;

        do {
            if (slot == lightClient.optimisticSlots(i)) {
                found = true;
                break;
            }
            if (i == 0) {
                i = 32;
            }
            i--;
        } while (i != currentIndex);

        if (!found) {
            revert BlockHeaderNotAvailable(slot);
        }

        bytes32 blockHeaderRoot = lightClient.optimisticHeaders(i);

        if (!SSZ.verifyBlockNumber(blockNumber, blockNumberProof, blockHeaderRoot)) {
            revert InvalidBlockNumberProof();
        }

        if (!SSZ.verifyBlockHash(blockHash, blockHashProof, blockHeaderRoot)) {
            revert InvalidBlockHashProof();
        }

        _storeHash(SOURCE_CHAIN_ID, blockNumber, blockHash);
    }

    /// @notice Updates DendrETH Light client and stores the given block
    //          for the update
    function storeBlockHeader(
        uint64 slot,
        uint256 blockNumber,
        bytes32[] calldata blockNumberProof,
        bytes32 blockHash,
        bytes32[] calldata blockHashProof,
        LightClientUpdate calldata update
    ) external {
        ILightClient lightClient = ILightClient(DENDRETH);

        lightClient.light_client_update(update);

        if (lightClient.optimisticHeaderSlot() != slot) {
            revert InvalidUpdate();
        }

        bytes32 blockHeaderRoot = lightClient.optimisticHeaderRoot();

        if (!SSZ.verifyBlockNumber(blockNumber, blockNumberProof, blockHeaderRoot)) {
            revert InvalidBlockNumberProof();
        }

        if (!SSZ.verifyBlockHash(blockHash, blockHashProof, blockHeaderRoot)) {
            revert InvalidBlockHashProof();
        }

        _storeHash(SOURCE_CHAIN_ID, blockNumber, blockHash);
    }
}
