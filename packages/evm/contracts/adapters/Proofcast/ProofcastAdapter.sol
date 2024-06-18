// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Message } from "../../interfaces/IMessage.sol";
import { MessageIdCalculator } from "../../utils/MessageIdCalculator.sol";
import { MessageHashCalculator } from "../../utils/MessageHashCalculator.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { RLPReader } from "solidity-rlp/contracts/RLPReader.sol";
import { IERC777Recipient } from "@openzeppelin/contracts/interfaces/IERC777Recipient.sol";
import { IERC1820RegistryUpgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC1820RegistryUpgradeable.sol";
import { BlockHashAdapter } from "../BlockHashAdapter.sol";

contract ProofcastAdapter is BlockHashAdapter, MessageIdCalculator, MessageHashCalculator, Ownable {
    string public constant PROVIDER = "proofcast";

    // MessageDispatched(uint256 indexed messageId, Message message)
    bytes32 public constant MESSAGE_DISPATCHED_EVENT_TOPIC =
        0x218247aabc759e65b5bb92ccc074f9d62cd187259f2a0984c3c9cf91f67ff7cf;
    uint256 public constant TEE_ADDRESS_CHANGE_GRACE_PERIOD = 48 hours;

    address public teeAddress;
    address public teeAddressNew;
    uint256 public teeAddressChangeGraceThreshold;
    mapping(uint256 => address) public yahos;

    error NotUsableYaho();
    error InvalidEventRLP();
    error InvalidTeeSigner();
    error InvalidSignature();
    error InvalidYahoAddress();
    error InvalidEventContentLength(uint256 length);
    error UnsupportedProtocolId(bytes1 protocolId);
    error UnsupportedChainId(uint256 chainId);
    error UnexpectedEventTopic(bytes32 topic);
    error InvalidSender();
    error InvalidMessageId(uint256 actual, uint256 expected);
    error InvalidDestinationChainId(uint256 chainId);
    error GracePeriodNotElapsed();
    error InvalidNewTeeSigner();

    event TeeSignerChanged(address newAddress);
    event TeeSignerPendingChange(address newAddress, bytes attestation, uint256 gracePeriod);
    event YahoInitialized(uint256 chainId, address yaho);

    function initYaho(uint256 chainId, address yaho_) public onlyOwner {
        if (chainId == block.chainid) {
            revert NotUsableYaho();
        }
        yahos[chainId] = yaho_;
        emit YahoInitialized(chainId, yaho_);
    }

    function setTeeSigner(bytes calldata pubKey, bytes memory attestation) public onlyOwner {
        if (teeAddress == address(0)) {
            // Setting the teeAddress the first time
            teeAddress = _getAddressFromPublicKey(pubKey);
            emit TeeSignerPendingChange(teeAddress, attestation, block.timestamp);
            emit TeeSignerChanged(teeAddress);
        } else {
            // The new address will be set after a grace period of 48 hours
            teeAddressNew = _getAddressFromPublicKey(pubKey);
            teeAddressChangeGraceThreshold = block.timestamp + TEE_ADDRESS_CHANGE_GRACE_PERIOD;
            emit TeeSignerPendingChange(teeAddressNew, attestation, teeAddressChangeGraceThreshold);
        }
    }

    function applyNewTeeSigner() external {
        if (block.timestamp < teeAddressChangeGraceThreshold) revert GracePeriodNotElapsed();
        if (teeAddressNew == address(0)) revert InvalidNewTeeSigner();

        teeAddress = teeAddressNew;
        teeAddressNew = address(0);

        emit TeeSignerChanged(teeAddress);
    }

    function verifyEventAndStoreHash(bytes calldata statement, bytes memory signature) external {
        if (teeAddress == address(0)) revert InvalidTeeSigner();
        if (ECDSA.recover(sha256(statement), signature) != teeAddress) revert InvalidSignature();

        // Supports only EVM events
        bytes1 protocolId = statement[1];
        if (protocolId != 0x00) revert UnsupportedProtocolId(protocolId);

        (uint256 domain, uint256[] memory ids, bytes32[] memory hashes) = _checkEventAndDecodeData(statement);
        _storeHashes(domain, ids, hashes);
    }

    function _checkEventAndDecodeData(
        bytes calldata statement
    ) internal view returns (uint256 domain, uint256[] memory ids, bytes32[] memory hashes) {
        //  Statement format:
        //    | version   | protocol   |  protocol_chain_id |   event id    | event_bytes |
        //    | (1 byte)  | (1 byte)   |    (32 bytes)      |  (32 bytes)   |  varlen     |

        uint16 offset = 2; // skip version, protocolId
        domain = uint256(bytes32(statement[offset:(offset += 32)]));

        if (yahos[domain] == address(0)) revert UnsupportedChainId(domain);

        offset += 32; // skip the event id (32 bytes)
        bytes memory eventBytes = statement[offset:];
        RLPReader.RLPItem memory eventRLP = RLPReader.toRlpItem(eventBytes);
        if (!RLPReader.isList(eventRLP)) revert InvalidEventRLP();

        RLPReader.RLPItem[] memory eventContent = RLPReader.toList(eventRLP);

        // Event must contain address, logs and data
        if (eventContent.length != 3) revert InvalidEventContentLength(eventContent.length);

        // MessageDispatched event parsing
        address yahoAddress = RLPReader.toAddress(eventContent[0]);
        if (yahoAddress != yahos[domain]) revert InvalidYahoAddress();

        RLPReader.RLPItem[] memory logs = RLPReader.toList(eventContent[1]);

        bytes32 topic = bytes32(RLPReader.toBytes(logs[0]));
        if (topic != MESSAGE_DISPATCHED_EVENT_TOPIC) revert UnexpectedEventTopic(topic);

        bytes memory messageBytes = RLPReader.toBytes(eventContent[2]);
        Message memory message = abi.decode(messageBytes, (Message));
        bytes32 messageHash = calculateMessageHash(message);
        uint256 expectedMessageId = calculateMessageId(domain, yahoAddress, messageHash);

        uint256 messageId = uint256(bytes32(RLPReader.toBytes(logs[1])));
        if (messageId != expectedMessageId) revert InvalidMessageId(messageId, expectedMessageId);
        ids = new uint256[](1);
        hashes = new bytes32[](1);
        ids[0] = messageId;
        hashes[0] = messageHash;
    }

    function _getAddressFromPublicKey(bytes calldata pubKey) internal pure returns (address) {
        return address(uint160(uint256(keccak256(pubKey[1:]))));
    }
}
