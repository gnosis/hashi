// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { BlockHashOracleAdapter } from "../BlockHashOracleAdapter.sol";
import { IWormhole, VM } from "./interfaces/IWormhole.sol";

contract WormholeAdapter is BlockHashOracleAdapter, Ownable {
    IWormhole public immutable WORMHOLE;

    mapping(uint32 => bytes32) public enabledReporters;
    mapping(uint32 => uint256) public chainIds;

    error InvalidMessage(VM vm, string reason);
    error UnauthorizedWormholeReceive();

    event ReporterSet(uint256 indexed chainId, uint16 indexed endpointId, address indexed reporter);

    constructor(address wormhole) {
        WORMHOLE = IWormhole(wormhole);
    }

    function setReporterByChain(uint256 chainId, uint16 wormholeChainId, address reporter) external onlyOwner {
        enabledReporters[wormholeChainId] = bytes32(uint256(uint160(reporter)));
        chainIds[wormholeChainId] = wormholeChainId;
        emit ReporterSet(chainId, wormholeChainId, reporter);
    }

    function storeHashesByEncodedVM(bytes calldata encodedVM) external {
        (VM memory vm, bool valid, string memory reason) = WORMHOLE.parseAndVerifyVM(encodedVM);
        if (!valid) revert InvalidMessage(vm, reason);
        if (enabledReporters[vm.emitterChainId] != vm.emitterAddress) revert UnauthorizedWormholeReceive();
        (uint256[] memory ids, bytes32[] memory hashes) = abi.decode(vm.payload, (uint256[], bytes32[]));
        _storeHashes(chainIds[vm.emitterChainId], ids, hashes);
    }
}
