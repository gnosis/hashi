// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { BlockHashAdapter } from "../BlockHashAdapter.sol";
import { IDeBridgeGate } from "./interfaces/IDeBridgeGate.sol";
import { ICallProxy } from "./interfaces/ICallProxy.sol";

contract DeBridgeAdapter is BlockHashAdapter, Ownable {
    string public constant PROVIDER = "debridge";

    IDeBridgeGate public immutable deBridgeGate;

    mapping(uint256 => address) public enabledReporters;

    error NotProxy();
    error UnauthorizedSender(address sender, uint256 chainId);

    event ReporterSet(uint256 indexed chainId, address indexed reporter);

    constructor(address _deBridgeGate) {
        deBridgeGate = IDeBridgeGate(_deBridgeGate);
    }

    function setReporterByChainId(uint256 chainId, address reporter) external onlyOwner {
        enabledReporters[chainId] = reporter;
        emit ReporterSet(chainId, reporter);
    }

    function storeHashes(uint256[] calldata ids, bytes32[] calldata hashes) external {
        ICallProxy callProxy = ICallProxy(deBridgeGate.callProxy());
        if (address(callProxy) != msg.sender) revert NotProxy();

        address sender = address(uint160(bytes20(callProxy.submissionNativeSender())));
        uint256 chainId = callProxy.submissionChainIdFrom();
        if (enabledReporters[chainId] != sender) revert UnauthorizedSender(sender, chainId);

        _storeHashes(chainId, ids, hashes);
    }
}
