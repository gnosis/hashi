// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ILayerZeroReceiver } from "./interfaces/ILayerZeroReceiver.sol";
import { BlockHashOracleAdapter } from "../BlockHashOracleAdapter.sol";

contract LayerZeroAdapter is BlockHashOracleAdapter, Ownable, ILayerZeroReceiver {
    string public constant PROVIDER = "layer-zero";
    address public immutable LAYER_ZERO_ENDPOINT;

    mapping(uint32 => bytes32) public enabledReportersPaths;
    mapping(uint32 => uint256) public chainIds;

    error UnauthorizedLayerZeroReceive();

    event ReporterSet(uint256 indexed chainId, uint16 indexed endpointId, address indexed reporter);

    constructor(address lzEndpoint) {
        LAYER_ZERO_ENDPOINT = lzEndpoint;
    }

    function lzReceive(uint16 srcEndpointId, bytes memory srcPath, uint64 /* nonce */, bytes memory payload) external {
        if (msg.sender != LAYER_ZERO_ENDPOINT || enabledReportersPaths[srcEndpointId] != keccak256(srcPath))
            revert UnauthorizedLayerZeroReceive();
        uint256 sourceChainId = chainIds[srcEndpointId];
        (uint256[] memory ids, bytes32[] memory hashes) = abi.decode(payload, (uint256[], bytes32[]));
        _storeHashes(sourceChainId, ids, hashes);
    }

    function setReporterByChain(uint256 chainId, uint16 endpointId, address reporter) external onlyOwner {
        enabledReportersPaths[endpointId] = keccak256(abi.encodePacked(reporter, address(this)));
        chainIds[endpointId] = chainId;
        emit ReporterSet(chainId, endpointId, reporter);
    }
}
