// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IDapp } from "@routerprotocol/evm-gateway-contracts/contracts/IDapp.sol";
import { IGateway } from "@routerprotocol/evm-gateway-contracts/contracts/IGateway.sol";
import { BlockHashAdapter } from "../BlockHashAdapter.sol";

contract RouterAdapter is BlockHashAdapter, Ownable, IDapp {
    string public constant PROVIDER = "router";

    IGateway public immutable ROUTER_GATEWAY;

    mapping(bytes32 => bytes32) public enabledReporters;
    mapping(bytes32 => uint256) public chainIds;

    error UnauthorizedRouterReceive();
    error RouterIAckNotSupported();

    event ReporterSet(uint256 indexed chainId, string name, string indexed reporter);

    constructor(address routerGateway) {
        ROUTER_GATEWAY = IGateway(routerGateway);
    }

    function setReporterByChain(
        uint256 chainId,
        string calldata chainIdStr,
        string calldata reporter
    ) external onlyOwner {
        bytes32 chainIdHash = keccak256(bytes(chainIdStr));
        enabledReporters[chainIdHash] = keccak256(bytes(reporter));
        chainIds[chainIdHash] = chainId;
        emit ReporterSet(chainId, chainIdStr, reporter);
    }

    function iReceive(
        string calldata requestSender,
        bytes calldata packet,
        string calldata srcChainId
    ) external override returns (bytes memory) {
        bytes32 chainIdHash = keccak256(bytes(srcChainId));
        uint256 sourceChainId = chainIds[chainIdHash];

        if (
            msg.sender != address(ROUTER_GATEWAY) ||
            enabledReporters[chainIdHash] != keccak256(bytes(requestSender)) ||
            sourceChainId == 0
        ) revert UnauthorizedRouterReceive();

        (uint256[] memory ids, bytes32[] memory hashes) = abi.decode(packet, (uint256[], bytes32[]));
        _storeHashes(sourceChainId, ids, hashes);

        return hex"";
    }

    function iAck(uint256, bool, bytes memory) external override {
        revert RouterIAckNotSupported();
    }
}
