// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { CCIPReceiver } from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import { Client } from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import { BlockHashOracleAdapter } from "../BlockHashOracleAdapter.sol";

contract CCIPAdapter is BlockHashOracleAdapter, Ownable, CCIPReceiver {
    string public constant PROVIDER = "ccip";

    mapping(uint64 => address) public enabledReporters;
    mapping(uint64 => uint256) public chainIds;

    error UnauthorizedCCIPReceive();

    event ReporterSet(uint256 indexed chainId, uint64 indexed chainSelector, address indexed reporter);

    constructor(address ccipRouter) CCIPReceiver(ccipRouter) {}

    function setReporterByChain(uint256 chainId, uint64 chainSelector, address reporter) external onlyOwner {
        enabledReporters[chainSelector] = reporter;
        chainIds[chainSelector] = chainId;
        emit ReporterSet(chainId, chainSelector, reporter);
    }

    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        // NOTE: validity of `msg.sender` is ensured by `CCIPReceiver` prior this internal function invocation
        address sender = abi.decode(message.sender, (address));
        if (enabledReporters[message.sourceChainSelector] != sender) revert UnauthorizedCCIPReceive();
        uint256 sourceChainId = chainIds[message.sourceChainSelector];
        (uint256[] memory ids, bytes32[] memory hashes) = abi.decode(message.data, (uint256[], bytes32[]));
        _storeHashes(sourceChainId, ids, hashes);
    }
}
