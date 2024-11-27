// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { IJushin } from "../interfaces/IJushin.sol";
import { IAdapter } from "../interfaces/IAdapter.sol";
import { HopDecoder } from "../libraries/HopDecoder.sol";

contract HopReceiver is IJushin {
    address public yaru;
    uint256 public expectedSourceChainId;
    address public expectedSender;
    uint256 public expectedThreshold;
    bytes32 public expectedAdaptersHash;
    bytes32 public expectedHeaderHash;

    event MessageReceived(bytes message);

    function setConfigs(
        address yaru_,
        uint256 expectedSourceChainId_,
        address expectedSender_,
        uint256 expectedThreshold_,
        bytes32 expectedAdaptersHash_,
        bytes32 expectedHeaderHash_
    ) external {
        yaru = yaru_;
        expectedSourceChainId = expectedSourceChainId_;
        expectedSender = expectedSender_;
        expectedThreshold = expectedThreshold_;
        expectedAdaptersHash = expectedAdaptersHash_;
        expectedHeaderHash = expectedHeaderHash_;
    }

    function onMessage(
        uint256,
        uint256 sourceChainId,
        address sender,
        uint256 threshold,
        IAdapter[] calldata adapters,
        bytes calldata data
    ) external returns (bytes memory) {
        require(msg.sender == yaru, "!yaru");
        require(sourceChainId == expectedSourceChainId, "!expectedSourceChainId");
        require(sender == expectedSender, "!expectedSender");
        require(threshold == expectedThreshold, "!expectedThreshold");
        require(keccak256(abi.encodePacked(adapters)) == expectedAdaptersHash, "!expectedAdaptersHash");
        (bytes memory header, bytes memory message) = HopDecoder.decodeHeaderAndMessage(data);
        require(keccak256(header) == expectedHeaderHash, "!expectedHeaderHash");
        emit MessageReceived(message);
        return abi.encodePacked(true);
    }
}
