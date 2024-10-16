// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { ILightClient, LightClientUpdate } from "./interfaces/IDendrETH.sol";
import { SSZ } from "../Telepathy/libraries/SimpleSerialize.sol";
import { Merkle } from "../Electron/lib/Merkle.sol";
import { Receipt } from "../Electron/lib/Receipt.sol";
import { BlockHashAdapter } from "../BlockHashAdapter.sol";

contract DendrETHAdapter is BlockHashAdapter {
    bytes32 internal constant MESSAGE_DISPATCHED_EVENT_SIG =
        0x218247aabc759e65b5bb92ccc074f9d62cd187259f2a0984c3c9cf91f67ff7cf; //  keccak256("MessageDispatched(uint256,(uint256,uint256,uint256,address,address,bytes,address[],address[]))");

    address public immutable DENDRETH_ADDRESS;
    address public immutable SOURCE_YAHO;
    uint256 public immutable SOURCE_CHAIN_ID;

    error FinalizedBlockHeaderNotAvailable(bytes32 finalizedHeader);
    error InvalidSlot();
    error InvalidBlockNumberProof();
    error InvalidBlockHashProof();
    error InvalidReceiptsRoot();
    error ErrorParseReceipt();
    error InvalidEventSignature();
    error InvalidEventSource();

    modifier onlyFinalizedHeaderIsInLightClient(bytes32 finalizedBlockHeader) {
        _checkFinalizedHeaderIsInLightClient(finalizedBlockHeader);
        _;
    }

    constructor(address dendrETHAddress, uint256 sourceChainId, address sourceYaho) {
        DENDRETH_ADDRESS = dendrETHAddress;
        SOURCE_CHAIN_ID = sourceChainId;
        SOURCE_YAHO = sourceYaho;
    }

    /// @notice Stores the block header for a given block only if it exists
    //          in the DendrETH Light Client for the SOURCE_CHAIN_ID.
    function storeBlockHeader(
        bytes32 finalizedBlockHeader,
        uint256 blockNumber,
        bytes32[] calldata blockNumberProof,
        bytes32 blockHash,
        bytes32[] calldata blockHashProof
    ) external onlyFinalizedHeaderIsInLightClient(finalizedBlockHeader) {
        if (!SSZ.verifyBlockNumber(blockNumber, blockNumberProof, finalizedBlockHeader)) {
            revert InvalidBlockNumberProof();
        }

        if (!SSZ.verifyBlockHash(blockHash, blockHashProof, finalizedBlockHeader)) {
            revert InvalidBlockHashProof();
        }

        _storeHash(SOURCE_CHAIN_ID, blockNumber, blockHash);
    }

    /// @notice Updates DendrETH Light client and stores the given block
    //          for the update
    function storeBlockHeader(
        uint256 blockNumber,
        bytes32[] calldata blockNumberProof,
        bytes32 blockHash,
        bytes32[] calldata blockHashProof,
        LightClientUpdate calldata update
    ) external {
        ILightClient lightClient = ILightClient(DENDRETH_ADDRESS);

        lightClient.lightClientUpdate(update);

        bytes32 finalizedHeaderRoot = lightClient.finalizedHeaderRoot();

        if (!SSZ.verifyBlockNumber(blockNumber, blockNumberProof, finalizedHeaderRoot)) {
            revert InvalidBlockNumberProof();
        }

        if (!SSZ.verifyBlockHash(blockHash, blockHashProof, finalizedHeaderRoot)) {
            revert InvalidBlockHashProof();
        }

        _storeHash(SOURCE_CHAIN_ID, blockNumber, blockHash);
    }

    function verifyAndStoreDispatchedMessage(
        bytes32 srcFinalizedHeader,
        uint64 srcSlot,
        bytes32[] calldata slotProof,
        uint64 txSlot,
        bytes32[] memory receiptsRootProof,
        bytes32 receiptsRoot,
        bytes[] memory receiptProof,
        bytes memory txIndexRLPEncoded,
        uint256 logIndex
    ) external onlyFinalizedHeaderIsInLightClient(srcFinalizedHeader) {
        if (!SSZ.verifySlot(srcSlot, slotProof, srcFinalizedHeader)) {
            revert InvalidSlot();
        }

        bool isValidReceiptsRoot = Merkle.verifyReceiptsRoot(
            receiptsRootProof,
            receiptsRoot,
            srcSlot,
            txSlot,
            srcFinalizedHeader
        );

        if (!isValidReceiptsRoot) revert InvalidReceiptsRoot();

        Receipt.ParsedReceipt memory parsedReceipt = Receipt.parseReceipt(
            receiptsRoot,
            receiptProof,
            txIndexRLPEncoded,
            logIndex
        );

        if (!parsedReceipt.isValid) revert ErrorParseReceipt();
        if (bytes32(parsedReceipt.topics[0]) != MESSAGE_DISPATCHED_EVENT_SIG) revert InvalidEventSignature();
        if (parsedReceipt.eventSource != SOURCE_YAHO) revert InvalidEventSource();

        uint256 messageId = uint256(parsedReceipt.topics[1]);
        bytes32 messageHash = keccak256(parsedReceipt.data);

        _storeHash(SOURCE_CHAIN_ID, messageId, messageHash);
    }

    function _checkFinalizedHeaderIsInLightClient(bytes32 finalizedBlockHeader) internal view {
        ILightClient lightClient = ILightClient(DENDRETH_ADDRESS);

        uint256 currentIndex = lightClient.currentIndex();
        uint256 i = currentIndex;
        bool found = false;

        do {
            if (finalizedBlockHeader == lightClient.finalizedHeaders(i)) {
                found = true;
                break;
            }
            if (i == 0) {
                i = 32;
            }
            i--;
        } while (i != currentIndex);

        if (!found) {
            revert FinalizedBlockHeaderNotAvailable(finalizedBlockHeader);
        }
    }
}
