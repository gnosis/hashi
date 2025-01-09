// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { ISP1LightClient } from "./interfaces/ISP1LightClient.sol";
import { SSZ } from "../Telepathy/libraries/SimpleSerialize.sol";
import { Merkle } from "../Spectre/lib/Merkle.sol";
import { Receipt } from "../Electron/lib/Receipt.sol";
import { BlockHashAdapter } from "../BlockHashAdapter.sol";

contract SP1HeliosAdapter is BlockHashAdapter {
    string public constant PROVIDER = "sp1-helios";
    bytes32 internal constant MESSAGE_DISPATCHED_EVENT_SIG =
        0x218247aabc759e65b5bb92ccc074f9d62cd187259f2a0984c3c9cf91f67ff7cf; //  keccak256("MessageDispatched(uint256,(uint256,uint256,uint256,address,address,bytes,address[],address[]))");

    address public immutable SP1_HELIOS_ADDRESS;
    address public immutable SOURCE_YAHO;
    uint256 public immutable SOURCE_CHAIN_ID;

    error HeaderNotAvailable();
    error InvalidBlockNumberProof();
    error InvalidBlockHashProof();
    error InvalidReceiptsRoot();
    error ErrorParseReceipt();
    error InvalidEventSignature();
    error InvalidEventSource();

    constructor(address sp1HeliosAddress, uint256 sourceChainId, address sourceYaho) {
        SP1_HELIOS_ADDRESS = sp1HeliosAddress;
        SOURCE_CHAIN_ID = sourceChainId;
        SOURCE_YAHO = sourceYaho;
    }

    function storeBlockHeader(
        uint256 slot,
        uint256 blockNumber,
        bytes32[] calldata blockNumberProof,
        bytes32 blockHash,
        bytes32[] calldata blockHashProof
    ) external {
        bytes32 header = _getHeader(slot);

        if (!SSZ.verifyBlockNumber(blockNumber, blockNumberProof, header)) {
            revert InvalidBlockNumberProof();
        }

        if (!SSZ.verifyBlockHash(blockHash, blockHashProof, header)) {
            revert InvalidBlockHashProof();
        }

        _storeHash(SOURCE_CHAIN_ID, blockNumber, blockHash);
    }

    function verifyAndStoreDispatchedMessage(
        uint64 headerSlot,
        uint64 txSlot,
        bytes32[] memory receiptsRootProof,
        bytes32 receiptsRoot,
        bytes[] memory receiptProof,
        bytes memory txIndexRLPEncoded,
        uint256 logIndex
    ) external {
        bytes32 header = _getHeader(headerSlot);

        bool isValidReceiptsRoot = Merkle.verifyReceiptsRoot(
            receiptsRootProof,
            receiptsRoot,
            headerSlot,
            txSlot,
            header
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

    function _getHeader(uint256 slot) internal view returns (bytes32) {
        bytes32 header = ISP1LightClient(SP1_HELIOS_ADDRESS).headers(slot);
        if (header == bytes32(0)) {
            revert HeaderNotAvailable();
        }
        return header;
    }
}
