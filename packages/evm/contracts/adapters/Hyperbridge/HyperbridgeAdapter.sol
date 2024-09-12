// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { BlockHashAdapter } from "../BlockHashAdapter.sol";
import { BaseIsmpModule, IncomingPostRequest } from "@polytope-labs/ismp-solidity/interfaces/IIsmpModule.sol";
import { StateMachine } from "@polytope-labs/ismp-solidity/interfaces/StateMachine.sol";

contract HyperbridgeAdapter is BlockHashAdapter, Ownable, BaseIsmpModule {
    mapping(uint32 => bytes32) public enabledReporters;
    mapping(uint32 => uint256) public chainIds;

    error UnauthorizedRequest();

    event ReporterSet(uint256 indexed chainId, uint16 indexed chainId, address indexed reporter);

    function setReporterByChain(uint256 chainId, uint16 chainId, address reporter) external onlyOwner {
        bytes32 stateMachineId = keccak256(StateMachine.evm(chainId));
        enabledReportersPaths[stateMachineId] = keccak256(reporter);
        chainIds[stateMachineId] = chainId;
        emit ReporterSet(chainId, chainId, reporter);
    }

    /// Process incoming blockhashes
    function onAccept(
        IncomingPostRequest calldata incoming
    ) external override onlyHost {
        bytes32 stateMachineId = keccak256(incoming.request.source);
        if (enabledReportersPaths[stateMachineId] != keccak256(incoming.request.from))
            revert UnauthorizedRequest();
        uint256 sourceChainId = chainIds[stateMachineId];
        (uint256[] memory ids, bytes32[] memory hashes) = abi.decode(payload, (uint256[], bytes32[]));
        _storeHashes(sourceChainId, ids, hashes);
    }
}
