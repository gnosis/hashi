// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

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
        if (headerRoot == bytes32(0)) revert("Missing header on the lightclient");

        bool isValidReceiptsRoot = Merkle.verifyReceiptsRoot(
            receiptsRootProof,
            receiptsRoot,
            lcSlot,
            txSlot,
            headerRoot
        );
        if (!isValidReceiptsRoot) revert("Invalid receipts root");

        Receipt.ParsedReceipt memory parsedReceipt = Receipt.parseReceipt(
            receiptsRoot,
            receiptProof,
            txIndexRLP,
            logIndex
        );

        if (!parsedReceipt.isValid) revert("Error parsing receipt");

        // ensure correct event source
        if (parsedReceipt.eventSource != eventSource) revert("Invalid event source");

        // ensure correct event signature
        if (bytes32(parsedReceipt.topics[0]) != EVENT_SIG_HASH) revert("Invalid event signature");

        uint256 blockNumber = uint256(parsedReceipt.topics[1]);
        bytes32 blockHash = parsedReceipt.topics[2];

        _storeHash(chainIdSource, blockNumber, blockHash);
    }

    function setLightClientAddress(address lightclientAddress) external onlyOwner {
        lightClient = ILightClient(lightclientAddress);
    }
}
