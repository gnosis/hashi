// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { ILayerZeroEndpoint } from "./interfaces/ILayerZeroEndpoint.sol";

abstract contract LayerZeroReporter {
    string public constant PROVIDER = "layer-zero";
    ILayerZeroEndpoint public immutable LAYER_ZERO_ENDPOINT;
    uint16 public immutable LAYER_ZERO_ADAPTER_CHAIN;

    constructor(address lzEndpoint, uint16 lzAdapterChain) {
        LAYER_ZERO_ENDPOINT = ILayerZeroEndpoint(lzEndpoint);
        LAYER_ZERO_ADAPTER_CHAIN = lzAdapterChain;
    }

    function _lzSend(bytes memory payload, address adapter) internal {
        bytes memory path = abi.encodePacked(adapter, address(this));
        // solhint-disable-next-line check-send-result
        LAYER_ZERO_ENDPOINT.send{ value: msg.value }(
            LAYER_ZERO_ADAPTER_CHAIN, // _dstChainId: destination LayerZero chainId
            path, // _destination: send to this address on the destination
            payload, // _payload: bytes payload
            payable(msg.sender), // _refundAddress: refund address
            address(0), // _zroPaymentAddress: future parameter
            bytes("") // _adapterParams: adapterParams (see "Advanced Features")
        );
    }
}
