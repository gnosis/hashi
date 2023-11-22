// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { ILayerZeroEndpoint } from "./interfaces/ILayerZeroEndpoint.sol";
import { HeaderReporter } from "../HeaderReporter.sol";

contract LayerZeroReporter is HeaderReporter {
    string public constant PROVIDER = "layer-zero";
    address public immutable LZ_ENDPOINT;
    uint16 public immutable LZ_ADAPTER_CHAIN;

    constructor(
        address headerStorage,
        uint256 adapterChain,
        address adapterAddress,
        address lzEndpoint,
        uint16 lzAdapterChain
    ) HeaderReporter(headerStorage, adapterChain, adapterAddress) {
        LZ_ENDPOINT = lzEndpoint;
        LZ_ADAPTER_CHAIN = lzAdapterChain;
    }

    function _sendPayload(bytes memory payload) internal override {
        bytes memory path = abi.encodePacked(ADAPTER_ADDRESS, address(this));
        // solhint-disable-next-line check-send-result
        ILayerZeroEndpoint(LZ_ENDPOINT).send{ value: msg.value }(
            LZ_ADAPTER_CHAIN, // _dstChainId: destination LayerZero chainId
            path, // _destination: send to this address on the destination
            payload, // _payload: bytes payload
            payable(msg.sender), // _refundAddress: refund address
            address(0), // _zroPaymentAddress: future parameter
            bytes("") // _adapterParams: adapterParams (see "Advanced Features")
        );
    }
}
