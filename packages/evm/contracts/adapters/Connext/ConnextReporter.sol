// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IConnext } from "@connext/interfaces/core/IConnext.sol";

abstract contract ConnextReporter {
    string public constant PROVIDER = "connext";
    IConnext public immutable CONNEXT;
    uint32 public immutable CONNEXT_ADAPTER_CHAIN;

    event ConnextTransfer(bytes32 transferId);

    constructor(address connext, uint32 connextAdapterChain) {
        CONNEXT = IConnext(connext);
        CONNEXT_ADAPTER_CHAIN = connextAdapterChain;
    }

    function _connextSend(bytes memory payload, address adapter) internal {
        bytes32 transferId = CONNEXT.xcall{ value: msg.value }(
            CONNEXT_ADAPTER_CHAIN, // _destination: Domain ID of the destination chain
            adapter, // _to: address of the target contract
            address(0), // _asset: use address zero for 0-value transfers
            msg.sender, // _delegate: address that can revert or forceLocal on destination
            0, // _amount: 0 because no funds are being transferred
            0, // _slippage: can be anything between 0-10000 because no funds are being transferred
            payload // _callData: the encoded calldata to send
        );
        emit ConnextTransfer(transferId);
    }
}
