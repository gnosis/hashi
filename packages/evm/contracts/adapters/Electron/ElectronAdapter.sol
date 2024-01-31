// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { BlockHashOracleAdapter } from "../BlockHashOracleAdapter.sol";
import { ILightClient } from "./interfaces/ILightClient.sol";
import { Merkle } from "./lib/Merkle.sol";
import { Receipt } from "./lib/Receipt.sol";
import { Ownable } from "openzeppelin/access/Ownable.sol";

contract ElectronAdapter is BlockHashOracleAdapter, Ownable {
    ILightClient public lightClient;

    bytes32 public constant EVENT_SIG_HASH = 0xf7df17dce0093aedfcbae24b4f04e823f9e863c97986ab1ba6c5267ace49ddea; // HeaderStored(uint256,bytes32)

    address public eventSource; // HeaderStorage contract address
    uint256 public chainIdSource; // Chain ID of HeaderStorage

    error MissingHeaderOnLC(uint256 slot);
    error InvalidReceiptsRoot();
    error ErrorParseReceipt();
    error InvalidEventSource();
    error InvalidEventSignature();

    constructor(address _lightClientAddress, address _eventSourceAddress, uint256 _chainIdSource) Ownable() {
        lightClient = ILightClient(_lightClientAddress);
        eventSource = _eventSourceAddress;
        chainIdSource = _chainIdSource;
    }

    function storeHash(bytes calldata _metadata) external {
        (
            bytes memory lcSlotTxSlotPack,
            bytes32[] memory receiptsRootProof,
            bytes32 receiptsRoot,
            bytes[] memory receiptProof,
            bytes memory txIndexRLP,
            uint256 logIndex
        ) = abi.decode(_metadata, (bytes, bytes32[], bytes32, bytes[], bytes, uint256));

        (uint64 lcSlot, uint64 txSlot) = abi.decode(lcSlotTxSlotPack, (uint64, uint64));
        bytes32 headerRoot = lightClient.headers(lcSlot);
        if (headerRoot == bytes32(0)) revert MissingHeaderOnLC(lcSlot);

        bool isValidReceiptsRoot = Merkle.verifyReceiptsRoot(
            receiptsRootProof,
            receiptsRoot,
            lcSlot,
            txSlot,
            headerRoot
        );
        if (!isValidReceiptsRoot) revert InvalidReceiptsRoot();

        Receipt.ParsedReceipt memory parsedReceipt = Receipt.parseReceipt(
            receiptsRoot,
            receiptProof,
            txIndexRLP,
            logIndex
        );

        if (!parsedReceipt.isValid) revert ErrorParseReceipt();

        // ensure correct event source
        if (parsedReceipt.eventSource != eventSource) revert InvalidEventSource();

        // ensure correct event signature
        if (bytes32(parsedReceipt.topics[0]) != EVENT_SIG_HASH) revert InvalidEventSignature();

        uint256 blockNumber = uint256(parsedReceipt.topics[1]);
        bytes32 blockHash = parsedReceipt.topics[2];

        _storeHash(chainIdSource, blockNumber, blockHash);
    }

    function setLightClientAddress(address lightclientAddress) external onlyOwner {
        lightClient = ILightClient(lightclientAddress);
    }
}
