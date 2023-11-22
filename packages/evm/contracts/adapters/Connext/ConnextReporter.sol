// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IConnext } from "@connext/interfaces/core/IConnext.sol";
import { HeaderReporter } from "../HeaderReporter.sol";

contract ConnextReporter is HeaderReporter {
    string public constant PROVIDER = "connext";
    address public immutable CONNEXT;
    uint32 public immutable CONNEXT_ADAPTER_CHAIN;

    event ConnextTransfer(bytes32 transferId);

    constructor(
        address headerStorage,
        uint256 adapterChain,
        address adapterAddress,
        address connext,
        uint32 connextAdapterChain
    ) HeaderReporter(headerStorage, adapterChain, adapterAddress) {
        CONNEXT = connext;
        CONNEXT_ADAPTER_CHAIN = connextAdapterChain;
    }

    function _sendPayload(bytes memory payload) internal override {
        bytes32 transferId = IConnext(CONNEXT).xcall{ value: msg.value }(
            CONNEXT_ADAPTER_CHAIN, // _destination: Domain ID of the destination chain
            ADAPTER_ADDRESS, // _to: address of the target contract
            address(0), // _asset: use address zero for 0-value transfers
            msg.sender, // _delegate: address that can revert or forceLocal on destination
            0, // _amount: 0 because no funds are being transferred
            0, // _slippage: can be anything between 0-10000 because no funds are being transferred
            payload // _callData: the encoded calldata to send
        );
        emit ConnextTransfer(transferId);
    }
}
