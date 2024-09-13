// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { BlockHashAdapter } from "../BlockHashAdapter.sol";
import { BaseIsmpModule, IncomingPostRequest } from "@polytope-labs/ismp-solidity/interfaces/IIsmpModule.sol";
import { StateMachine } from "@polytope-labs/ismp-solidity/interfaces/StateMachine.sol";

contract HyperbridgeAdapter is BlockHashAdapter, Ownable, BaseIsmpModule {
    mapping(bytes32 => bytes32) public enabledReporters;
    mapping(bytes32 => uint256) public chainIds;

    error UnauthorizedRequest();

    event ReporterSet(uint256 indexed chainId, address indexed reporter);

    function setReporterByChain(uint256 chainId, address reporter) external onlyOwner {
        bytes32 stateMachineId = keccak256(StateMachine.evm(chainId));
        enabledReporters[stateMachineId] = keccak256(abi.encodePacked(reporter));
        chainIds[stateMachineId] = chainId;
        emit ReporterSet(chainId, reporter);
    }

    /// Process incoming requests
    function onAccept(IncomingPostRequest calldata incoming) external override onlyHost {
        bytes32 stateMachineId = keccak256(incoming.request.source);
        if (enabledReporters[stateMachineId] != keccak256(incoming.request.from)) revert UnauthorizedRequest();
        uint256 sourceChainId = chainIds[stateMachineId];
        (uint256[] memory ids, bytes32[] memory hashes) = abi.decode(incoming.request.body, (uint256[], bytes32[]));
        _storeHashes(sourceChainId, ids, hashes);
    }
}
