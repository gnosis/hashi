// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { AxelarExecutable } from "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";
import { BlockHashAdapter } from "../BlockHashAdapter.sol";

contract AxelarAdapter is BlockHashAdapter, Ownable, AxelarExecutable {
    string public constant PROVIDER = "axelar";

    mapping(bytes32 => bytes32) public enabledReporters;
    mapping(bytes32 => uint256) public chainIds;

    error UnauthorizedAxelarReceive();
    error ExecutionWithTokenNotSupported();

    event ReporterSet(uint256 indexed chainId, string name, string indexed reporter);

    constructor(address axelarGateway) AxelarExecutable(axelarGateway) {} // solhint-disable no-empty-blocks

    function setReporterByChain(
        uint256 chainId,
        string calldata chainName,
        string calldata reporter
    ) external onlyOwner {
        bytes32 chainNameHash = keccak256(bytes(chainName));
        enabledReporters[chainNameHash] = keccak256(bytes(reporter));
        chainIds[chainNameHash] = chainId;
        emit ReporterSet(chainId, chainName, reporter);
    }

    function _execute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        bytes32 chainNameHash = keccak256(bytes(sourceChain));
        bytes32 expectedSourceAddressHash = enabledReporters[chainNameHash];
        uint256 sourceChainId = chainIds[chainNameHash];
        if (expectedSourceAddressHash != keccak256(bytes(sourceAddress)) || sourceChainId == 0) {
            revert UnauthorizedAxelarReceive();
        }
        (uint256[] memory ids, bytes32[] memory hashes) = abi.decode(payload, (uint256[], bytes32[]));
        _storeHashes(sourceChainId, ids, hashes);
    }

    function _executeWithToken(
        string calldata /* sourceChain */,
        string calldata /* sourceAddress */,
        bytes calldata /* payload */,
        string calldata /* tokenSymbol */,
        uint256 /* amount */
    ) internal pure override {
        revert ExecutionWithTokenNotSupported();
    }
}
