// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ILayerZeroEndpointV2, MessagingParams } from "./interfaces/ILayerZeroEndpointV2.sol";
import { Reporter } from "../Reporter.sol";

contract LayerZeroReporter is Reporter, Ownable {
    string public constant PROVIDER = "layer-zero";
    ILayerZeroEndpointV2 public immutable LAYER_ZERO_ENDPOINT;

    mapping(uint256 => uint32) public endpointIds;
    uint256 public fee;

    error EndpointIdNotAvailable();

    event EndpointIdSet(uint256 indexed chainId, uint16 indexed endpointId);
    event FeeSet(uint256 fee);

    constructor(address headerStorage, address yaho, address lzEndpoint) Reporter(headerStorage, yaho) {
        LAYER_ZERO_ENDPOINT = ILayerZeroEndpointV2(lzEndpoint);
    }

    function setEndpointIdByChainId(uint256 chainId, uint16 endpointId) external onlyOwner {
        endpointIds[chainId] = endpointId;
        emit EndpointIdSet(chainId, endpointId);
    }

    function setFee(uint256 fee_) external onlyOwner {
        fee = fee_;
        emit FeeSet(fee);
    }

    function _dispatch(
        uint256 targetChainId,
        address adapter,
        uint256[] memory ids,
        bytes32[] memory hashes
    ) internal override returns (bytes32) {
        uint32 targetEndpointId = endpointIds[targetChainId];
        if (targetEndpointId == 0) revert EndpointIdNotAvailable();
        // https://github.com/LayerZero-Labs/LayerZero-v2/blob/1fde89479fdc68b1a54cda7f19efa84483fcacc4/oapp/contracts/oapp/libs/OptionsBuilder.sol#L38
        bytes memory options = abi.encodePacked(uint16(3));
        bytes memory message = abi.encode(ids, hashes);
        MessagingParams memory params = MessagingParams(
            targetEndpointId,
            bytes32(abi.encodePacked(adapter)),
            message,
            options,
            false
        );
        // solhint-disable-next-line check-send-result
        LAYER_ZERO_ENDPOINT.send{ value: fee }(
            params,
            address(0) // refundAddress
        );
        return bytes32(0);
    }

    receive() external payable {}
}
