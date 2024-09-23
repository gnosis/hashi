// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;
import { Origin } from "./ILayerZeroEndpointV2.sol";

interface ILayerZeroReceiver {
    function lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) external payable;

    function allowInitializePath(Origin calldata _origin) external view returns (bool);

    function nextNonce(uint32 _eid, bytes32 _sender) external view returns (uint64);
}
