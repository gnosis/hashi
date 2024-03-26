// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ILayerZeroEndpoint } from "./interfaces/ILayerZeroEndpoint.sol";
import { Reporter } from "../Reporter.sol";

contract LayerZeroReporter is Reporter, Ownable {
    string public constant PROVIDER = "layer-zero";
    ILayerZeroEndpoint public immutable LAYER_ZERO_ENDPOINT;

    mapping(uint256 => uint16) public endpointIds;

    error EndpointIdNotAvailable();

    event EndpointIdSet(uint256 indexed chainId, uint16 indexed endpointId);

    constructor(address headerStorage, address yaho, address lzEndpoint) Reporter(headerStorage, yaho) {
        LAYER_ZERO_ENDPOINT = ILayerZeroEndpoint(lzEndpoint);
    }

    function setEndpointIdByChainId(uint256 chainId, uint16 endpointId) external onlyOwner {
        endpointIds[chainId] = endpointId;
        emit EndpointIdSet(chainId, endpointId);
    }

    function _dispatch(
        uint256 targetChainId,
        address adapter,
        uint256[] memory ids,
        bytes32[] memory hashes
    ) internal override returns (bytes32) {
        uint16 targetEndpointId = endpointIds[targetChainId];
        if (targetEndpointId == 0) revert EndpointIdNotAvailable();
        bytes memory payload = abi.encode(ids, hashes);
        bytes memory path = abi.encodePacked(adapter, address(this));
        // solhint-disable-next-line check-send-result
        LAYER_ZERO_ENDPOINT.send{ value: msg.value }(
            targetEndpointId,
            path,
            payload,
            payable(msg.sender), // _refundAddress: refund address
            address(0), // _zroPaymentAddress: future parameter
            bytes("") // _adapterParams: adapterParams (see "Advanced Features")
        );
        return bytes32(0);
    }
}
