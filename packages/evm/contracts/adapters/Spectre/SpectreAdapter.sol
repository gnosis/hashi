// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Merkle } from "./lib/Merkle.sol";
import { Receipt } from "../Electron/lib/Receipt.sol";
import { BlockHashAdapter } from "../BlockHashAdapter.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ISpectre } from "./interfaces/ISpectre.sol";

contract SpectreAdapter is AccessControl, BlockHashAdapter {
    string public constant PROVIDER = "spectre";

    // keccak256("MessageDispatched(uint256,(uint256,uint256,uint256,address,address,bytes,address[],address[]))")
    bytes32 internal constant MESSAGE_DISPATCHED_EVENT_SIG =
        0x218247aabc759e65b5bb92ccc074f9d62cd187259f2a0984c3c9cf91f67ff7cf;

    address public immutable SOURCE_YAHO;
    uint256 public immutable SOURCE_CHAIN_ID;
    address public spectreAddress;

    error Unauthorized();
    error InvalidEventSource();
    error InvalidReceiptsRoot();
    error ErrorParseReceipt();
    error InvalidEventSignature();
    error BlockHeaderRootMissing();

    constructor(address initialSpectreAddress, uint256 sourceChainId, address sourceYaho) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        SOURCE_CHAIN_ID = sourceChainId;
        SOURCE_YAHO = sourceYaho;
        spectreAddress = initialSpectreAddress;
    }

    modifier onlyAdmin() {
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) revert Unauthorized();
        _;
    }

    function changeSpectreAddress(address newSpectreAddress) external onlyAdmin {
        spectreAddress = newSpectreAddress;
    }

    function verifyAndStoreDispatchedMessage(
        uint64 srcSlot,
        uint64 txSlot,
        bytes32[] memory receiptsRootProof,
        bytes32 receiptsRoot,
        bytes[] memory receiptProof,
        bytes memory txIndexRLPEncoded,
        uint256 logIndex
    ) external {
        bytes32 blockHeaderRoot = ISpectre(spectreAddress).blockHeaderRoots(srcSlot);
        if (blockHeaderRoot == bytes32(0)) revert BlockHeaderRootMissing();

        bool isValidReceiptsRoot = Merkle.verifyReceiptsRoot(
            receiptsRootProof,
            receiptsRoot,
            srcSlot,
            txSlot,
            blockHeaderRoot
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
}
