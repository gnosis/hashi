// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import "@polytope-labs/solidity-merkle-trees/src/MerklePatricia.sol";
import { RLPReader } from "@polytope-labs/solidity-merkle-trees/src/trie/ethereum/RLPReader.sol";

library Receipt {
    error UnsupportedTxType();

    struct ParsedReceipt {
        bool isValid;
        bytes32[] topics;
        bytes data;
        address eventSource;
    }
    using RLPReader for RLPReader.RLPItem;

    function parseReceipt(
        bytes32 receiptsRoot,
        bytes[] memory receiptProof,
        bytes memory txIndexRLP,
        uint256 logIndex
    ) internal pure returns (ParsedReceipt memory) {
        bytes32[] memory eventTopics;
        bytes memory eventData;
        address eventSource;
        ParsedReceipt memory parsedReceipt = ParsedReceipt({
            isValid: false,
            topics: eventTopics,
            data: eventData,
            eventSource: eventSource
        });

        // verify the merkle patricia proof for receipt and get the value for key `txIndexRLP`
        bytes[] memory keys = new bytes[](1);
        keys[0] = txIndexRLP;
        bytes memory value = MerklePatricia.VerifyEthereumProof(receiptsRoot, receiptProof, keys)[0].value;

        // https://eips.ethereum.org/EIPS/eip-2718
        // There are 3 possible receipt types: Legacy, 0x01 or 0x02 (More types can be added in future EIPs)
        uint256 offset;
        if (value[0] == 0x01 || value[0] == 0x02) {
            // first byte represents the TransactionType
            offset = 1;
        } else if (value[0] >= 0xc0) {
            // LegacyReceipt
            offset = 0;
        } else {
            revert UnsupportedTxType();
        }

        // memory pointer to the RLP Receipt
        uint256 memPtr;
        assembly {
            memPtr := add(value, add(0x20, mul(0x01, offset)))
        }

        // read Receipt as a list of RLPItem
        RLPReader.RLPItem[] memory receiptItems = RLPReader.RLPItem(value.length - offset, memPtr).toList();

        if (receiptItems.length != 4) return parsedReceipt;

        RLPReader.RLPItem[] memory logs = receiptItems[3].toList();

        if (logIndex >= logs.length) return parsedReceipt;
        RLPReader.RLPItem[] memory targetLog = logs[logIndex].toList();

        // extract eventSource address
        eventSource = targetLog[0].toAddress();

        // extract event topics
        RLPReader.RLPItem[] memory topicsItems = targetLog[1].toList();
        bytes32[] memory topics_ = new bytes32[](topicsItems.length);
        for (uint256 i = 0; i < topicsItems.length; ) {
            topics_[i] = bytes32(topicsItems[i].toBytes());
            unchecked {
                i++;
            }
        }
        eventTopics = topics_;

        // extract event data
        eventData = targetLog[2].toBytes();

        return ParsedReceipt({ isValid: true, topics: eventTopics, data: eventData, eventSource: eventSource });
    }
}
