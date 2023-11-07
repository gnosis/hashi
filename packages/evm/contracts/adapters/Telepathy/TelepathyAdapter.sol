// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { ILightClient, TelepathyStorage } from "./interfaces/ITelepathy.sol";
import { SSZ } from "./libraries/SimpleSerialize.sol";
import { OracleAdapter } from "../OracleAdapter.sol";
import { Message } from "../../interfaces/IMessageDispatcher.sol";

contract TelepathyAdapter is OracleAdapter {
    /// @dev The Telepathy Router contains a mapping of chainIds to Light Clients.
    address public immutable telepathyRouter;

    error NoLightClientOnChain(uint32 chainId);
    error InconsistentLightClient(address lightClient);
    error BlockHeaderNotAvailable(uint256 slot);
    error InvalidBlockNumberProof();
    error InvalidBlockHashProof();

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
        bytes32[] calldata _blockHashProof,
        address _yaho
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

        uint256[] memory blockNumbers = new uint256[](1);
        bytes32[] memory blockHeaders = new bytes32[](1);
        blockNumbers[0] = _blockNumber;
        blockHeaders[0] = _blockHash;

        Message memory message = Message(
            _chainId,
            block.chainid,
            address(0),
            address(0),
            abi.encode(blockNumbers, blockHeaders)
        );
        bytes32 messageHash = calculateMessageHash(message, _yaho);
        bytes32 messageId = calculateMessageId(keccak256(abi.encode(MESSAGE_BHR, bytes(abi.encode(0)))), messageHash);

        _storeHash(uint256(_chainId), messageId, messageHash);
    }
}
