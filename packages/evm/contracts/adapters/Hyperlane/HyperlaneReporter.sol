// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMailbox } from "@hyperlane-xyz/core/contracts/interfaces/IMailbox.sol";
import { IInterchainGasPaymaster } from "@hyperlane-xyz/core/contracts/interfaces/IInterchainGasPaymaster.sol";
import { HeaderReporter } from "../HeaderReporter.sol";

contract HyperlaneReporter is HeaderReporter {
    string public constant PROVIDER = "hyperlane";
    address public immutable HYPERLANE_MAILBOX;
    address public immutable HYPERLANE_PAYMASTER;
    uint32 public immutable HYPERLANE_ADAPTER_CHAIN;
    bytes32 public immutable HYPERLANE_ADAPTER_ADDRESS;

    constructor(
        address headerStorage,
        uint256 adapterChain,
        address adapterAddress,
        address hyperlaneMailbox,
        address hyperlanePaymaster,
        uint32 hyperlaneAdapterChain,
        bytes32 hyperlaneAdapterAddress
    ) HeaderReporter(headerStorage, adapterChain, adapterAddress) {
        HYPERLANE_MAILBOX = hyperlaneMailbox;
        HYPERLANE_PAYMASTER = hyperlanePaymaster;
        HYPERLANE_ADAPTER_CHAIN = hyperlaneAdapterChain;
        HYPERLANE_ADAPTER_ADDRESS = hyperlaneAdapterAddress;
    }

    function _sendPayload(bytes memory payload) internal override {
        bytes32 messageId = IMailbox(HYPERLANE_MAILBOX).dispatch(
            HYPERLANE_ADAPTER_CHAIN, // _destinationDomain
            HYPERLANE_ADAPTER_ADDRESS, // _recipientAddress
            payload // _messageBody
        );
        IInterchainGasPaymaster(HYPERLANE_PAYMASTER).payForGas{ value: msg.value }(
            messageId, // ID of the message that was just dispatched
            HYPERLANE_ADAPTER_CHAIN, // destination domain of the message
            200_000, // gas to use in the recipient's handle function
            msg.sender // refunds go to msg.sender, who paid the msg.value
        );
    }
}
