// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { BlockHashOracleAdapter } from "../BlockHashOracleAdapter.sol";
import { ILightClient } from "./interfaces/ILightClient.sol";
import { Merkle } from "./lib/Merkle.sol";
import { Receipt } from "./lib/Receipt.sol";
import "./lib/Ownable.sol";

contract ElectronAdapter is BlockHashOracleAdapter, Ownable {
    ILightClient public lightClient;

    address public constant EVENT_SOURCE = 0x4cD014AC64AAa899b46BF3a477B68bb67e33eDC4; // HeaderStorage contract
    bytes32 public constant EVENT_SIG_HASH = 0xf7df17dce0093aedfcbae24b4f04e823f9e863c97986ab1ba6c5267ace49ddea;
    uint256 public constant SOURCE_CHAIN_ID = 5;

    constructor(address lightClientAddress) Ownable(msg.sender) {
        lightClient = ILightClient(lightClientAddress);
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
        if (headerRoot == bytes32(0)) revert();

        bool isValidReceiptsRoot = Merkle.verifyReceiptsRoot(
            receiptsRootProof,
            receiptsRoot,
            lcSlot,
            txSlot,
            headerRoot
        );
        if (!isValidReceiptsRoot) revert();

        Receipt.ParsedReceipt memory parsedReceipt = Receipt.parseReceipt(
            receiptsRoot,
            receiptProof,
            txIndexRLP,
            logIndex
        );

        if (!parsedReceipt.isValid) revert();

        // ensure correct event source
        if (parsedReceipt.eventSource != EVENT_SOURCE) revert();

        // ensure correct event signature
        if (bytes32(parsedReceipt.topics[0]) != EVENT_SIG_HASH) revert();

        uint256 blockNumber = uint256(parsedReceipt.topics[1]);
        bytes32 blockHash = parsedReceipt.topics[2];

        _storeHash(SOURCE_CHAIN_ID, blockNumber, blockHash);
    }

    function setLightClientAddress(address lightclientAddress) external onlyOwner {
        lightClient = ILightClient(lightclientAddress);
    }
}
