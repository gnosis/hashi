// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ILayerZeroReceiver } from "./interfaces/ILayerZeroReceiver.sol";
import { Origin } from "./interfaces/ILayerZeroEndpointV2.sol";
import { BlockHashAdapter } from "../BlockHashAdapter.sol";

contract LayerZeroAdapter is BlockHashAdapter, Ownable, ILayerZeroReceiver {
    string public constant PROVIDER = "layer-zero";
    address public immutable LAYER_ZERO_ENDPOINT;

    mapping(uint32 => address) public enabledReporter;
    mapping(uint32 => uint256) public chainIds;

    error UnauthorizedLayerZeroReceive();

    event ReporterSet(uint256 indexed chainId, uint32 indexed endpointId, address indexed reporter);

    constructor(address lzEndpoint) {
        LAYER_ZERO_ENDPOINT = lzEndpoint;
    }

    function lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) external payable {
        if (
            msg.sender != LAYER_ZERO_ENDPOINT ||
            enabledReporter[_origin.srcEid] != address(uint160(uint256(_origin.sender)))
        ) revert UnauthorizedLayerZeroReceive();
        (uint256[] memory ids, bytes32[] memory hashes) = abi.decode(_message, (uint256[], bytes32[]));
        _storeHashes(chainIds[_origin.srcEid], ids, hashes);
    }

    function setReporterByChain(uint256 chainId, uint32 endpointId, address reporter) external onlyOwner {
        enabledReporter[endpointId] = reporter;
        chainIds[endpointId] = chainId;
        emit ReporterSet(chainId, endpointId, reporter);
    }
}
