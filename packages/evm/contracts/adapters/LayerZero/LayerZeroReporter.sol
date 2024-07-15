// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ILayerZeroEndpointV2, MessagingParams } from "./interfaces/ILayerZeroEndpointV2.sol";
import { Reporter } from "../Reporter.sol";
import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";
import { OAppCore } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OAppCore.sol";

contract LayerZeroReporter is Reporter, Ownable, OAppCore {
    using OptionsBuilder for bytes;

    string public constant PROVIDER = "layer-zero";
    ILayerZeroEndpointV2 public immutable LAYER_ZERO_ENDPOINT;

    mapping(uint256 => uint32) public endpointIds;
    uint128 public fee;
    address refundAddress;

    error EndpointIdNotAvailable();

    event EndpointIdSet(uint256 indexed chainId, uint32 indexed endpointId);
    event FeeSet(uint256 fee);

    constructor(
        address headerStorage,
        address yaho,
        address lzEndpoint,
        address delegate,
        address refundAddress_,
        uint128 defaultFee_
    ) Reporter(headerStorage, yaho) OAppCore(lzEndpoint, delegate) {
        refundAddress = refundAddress_;
        fee = defaultFee_;
        LAYER_ZERO_ENDPOINT = ILayerZeroEndpointV2(lzEndpoint);
    }

    function setEndpointIdByChainId(uint256 chainId, uint32 endpointId) external onlyOwner {
        endpointIds[chainId] = endpointId;
        emit EndpointIdSet(chainId, endpointId);
    }

    function setFee(uint128 fee_) external onlyOwner {
        fee = fee_;
        emit FeeSet(fee);
    }

    function setDefaultRefundAddress(address refundAddress_) external onlyOwner {
        refundAddress = refundAddress_;
    }

    function oAppVersion() public pure virtual override returns (uint64 senderVersion, uint64 receiverVersion) {
        return (1, 1);
    }

    function _dispatch(
        uint256 targetChainId,
        address adapter,
        uint256[] memory ids,
        bytes32[] memory hashes
    ) internal override returns (bytes32) {
        uint32 targetEndpointId = endpointIds[targetChainId];
        if (targetEndpointId == 0) revert EndpointIdNotAvailable();
        bytes memory options = OptionsBuilder.newOptions().addExecutorLzReceiveOption(fee, 0);
        bytes memory message = abi.encode(ids, hashes);
        MessagingParams memory params = MessagingParams(
            targetEndpointId,
            bytes32(abi.encode(adapter)),
            message,
            options,
            false // receiver in lz Token
        );
        // solhint-disable-next-line check-send-result
        LAYER_ZERO_ENDPOINT.send{ value: msg.value }(params, refundAddress);
        return bytes32(0);
    }
}
