// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { ILightClient, LightClientUpdate } from "./interfaces/IDendrETH.sol";
import { SSZ } from "../Telepathy/libraries/SimpleSerialize.sol";
import { BlockHashOracleAdapter } from "../BlockHashOracleAdapter.sol";

contract DendrETHAdapter is BlockHashOracleAdapter {
    error InvalidUpdate();
    error BlockHeaderNotAvailable(uint256 slot);
    error InvalidBlockNumberProof();
    error InvalidBlockHashProof();

    address public immutable dendrETHAddress;

    constructor(address _dendrETHAddress) {
        dendrETHAddress = _dendrETHAddress;
    }

    /// @notice Stores the block header for a given block only if it exists
    //          in the DendrETH Light Client for the chainId.
    function storeBlockHeader(
        uint32 _chainId,
        uint64 _slot,
        uint256 _blockNumber,
        bytes32[] calldata _blockNumberProof,
        bytes32 _blockHash,
        bytes32[] calldata _blockHashProof
    ) external {
        ILightClient lightClient = ILightClient(dendrETHAddress);

        uint256 currentIndex = lightClient.currentIndex();
        uint256 i = currentIndex;
        bool found = false;

        do {
            if (_slot == lightClient.optimisticSlots(i)) {
                found = true;
                break;
            }
            if (i == 0) {
                i = 32;
            }
            i--;
        } while (i != currentIndex);

        if (!found) {
            revert BlockHeaderNotAvailable(_slot);
        }

        bytes32 blockHeaderRoot = lightClient.optimisticHeaders(i);

        if (!SSZ.verifyBlockNumber(_blockNumber, _blockNumberProof, blockHeaderRoot)) {
            revert InvalidBlockNumberProof();
        }

        if (!SSZ.verifyBlockHash(_blockHash, _blockHashProof, blockHeaderRoot)) {
            revert InvalidBlockHashProof();
        }

        _storeHash(uint256(_chainId), _blockNumber, _blockHash);
    }

    /// @notice Updates DendrETH Light client and stores the given block
    //          for the update
    function storeBlockHeader(
        uint32 _chainId,
        uint64 _slot,
        uint256 _blockNumber,
        bytes32[] calldata _blockNumberProof,
        bytes32 _blockHash,
        bytes32[] calldata _blockHashProof,
        LightClientUpdate calldata update
    ) external {
        ILightClient lightClient = ILightClient(dendrETHAddress);

        lightClient.light_client_update(update);

        if (lightClient.optimisticHeaderSlot() != _slot) {
            revert InvalidUpdate();
        }

        bytes32 blockHeaderRoot = lightClient.optimisticHeaderRoot();

        if (!SSZ.verifyBlockNumber(_blockNumber, _blockNumberProof, blockHeaderRoot)) {
            revert InvalidBlockNumberProof();
        }

        if (!SSZ.verifyBlockHash(_blockHash, _blockHashProof, blockHeaderRoot)) {
            revert InvalidBlockHashProof();
        }

        _storeHash(uint256(_chainId), _blockNumber, _blockHash);
    }
}
