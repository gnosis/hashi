// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { ILayerZeroReceiver } from "./interfaces/ILayerZeroReceiver.sol";
import { HeaderOracleAdapter } from "../HeaderOracleAdapter.sol";

contract LayerZeroAdapter is HeaderOracleAdapter, ILayerZeroReceiver {
    string public constant PROVIDER = "layer-zero";
    address public immutable LAYER_ZERO_ENDPOINT;
    uint32 public immutable LAYER_ZERO_REPORTER_CHAIN;
    bytes32 public immutable LAYER_ZERO_REPORTER_PATH_HASH;

    error UnauthorizedLayerZeroReceive();

    constructor(
        uint256 reporterChain,
        address reporterAddress,
        address lzEndpoint,
        uint16 lzReporterChain
    ) HeaderOracleAdapter(reporterChain, reporterAddress) {
        LAYER_ZERO_ENDPOINT = lzEndpoint;
        LAYER_ZERO_REPORTER_CHAIN = lzReporterChain;
        bytes memory path = abi.encodePacked(reporterAddress, address(this));
        LAYER_ZERO_REPORTER_PATH_HASH = keccak256(path);
    }

    function lzReceive(uint16 srcChainId, bytes memory srcAddress, uint64 /* nonce */, bytes memory payload) external {
        if (
            msg.sender != LAYER_ZERO_ENDPOINT ||
            srcChainId != LAYER_ZERO_REPORTER_CHAIN ||
            keccak256(srcAddress) != LAYER_ZERO_REPORTER_PATH_HASH
        ) revert UnauthorizedLayerZeroReceive();
        _receivePayload(payload);
    }
}
