// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

enum MessageStatus {
    NOT_EXECUTED,
    EXECUTION_FAILED,
    EXECUTION_SUCCEEDED
}

struct Message {
    uint8 version;
    uint64 nonce;
    uint32 sourceChainId;
    address senderAddress;
    uint32 recipientChainId;
    bytes32 recipientAddress;
    bytes data;
}

interface ITelepathyRouter {
    event SentMessage(uint64 indexed nonce, bytes32 indexed msgHash, bytes message);

    function send(uint32 recipientChainId, bytes32 recipientAddress, bytes calldata data) external returns (bytes32);

    function send(uint32 recipientChainId, address recipientAddress, bytes calldata data) external returns (bytes32);

    function sendViaStorage(
        uint32 recipientChainId,
        bytes32 recipientAddress,
        bytes calldata data
    ) external returns (bytes32);

    function sendViaStorage(
        uint32 recipientChainId,
        address recipientAddress,
        bytes calldata data
    ) external returns (bytes32);
}

interface ITelepathyReceiver {
    event ExecutedMessage(
        uint32 indexed sourceChainId,
        uint64 indexed nonce,
        bytes32 indexed msgHash,
        bytes message,
        bool status
    );

    function executeMessage(
        uint64 slot,
        bytes calldata message,
        bytes[] calldata accountProof,
        bytes[] calldata storageProof
    ) external;

    function executeMessageFromLog(
        bytes calldata srcSlotTxSlotPack,
        bytes calldata messageBytes,
        bytes32[] calldata receiptsRootProof,
        bytes32 receiptsRoot,
        bytes[] calldata receiptProof, // receipt proof against receipt root
        bytes memory txIndexRLPEncoded,
        uint256 logIndex
    ) external;
}

interface ITelepathyHandler {
    function handleTelepathy(
        uint32 _sourceChainId,
        address _senderAddress,
        bytes memory _data
    ) external returns (bytes4);
}
