// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMailbox } from "@hyperlane-xyz/core/contracts/interfaces/IMailbox.sol";
import { IInterchainGasPaymaster } from "@hyperlane-xyz/core/contracts/interfaces/IInterchainGasPaymaster.sol";
import { TypeCasts } from "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";

abstract contract HyperlaneReporter {
    using TypeCasts for address;

    string public constant PROVIDER = "hyperlane";
    IMailbox public immutable HYPERLANE_MAILBOX;
    IInterchainGasPaymaster public immutable HYPERLANE_PAYMASTER;
    uint32 public immutable HYPERLANE_ADAPTER_CHAIN;

    constructor(address hyperlaneMailbox, address hyperlanePaymaster, uint32 hyperlaneAdapterChain) {
        HYPERLANE_MAILBOX = IMailbox(hyperlaneMailbox);
        HYPERLANE_PAYMASTER = IInterchainGasPaymaster(hyperlanePaymaster);
        HYPERLANE_ADAPTER_CHAIN = hyperlaneAdapterChain;
    }

    function _hyperlaneSend(bytes memory payload, address adapter) internal {
        bytes32 messageId = HYPERLANE_MAILBOX.dispatch(
            HYPERLANE_ADAPTER_CHAIN, // _destinationDomain
            adapter.addressToBytes32(), // _recipientAddress
            payload // _messageBody
        );
        HYPERLANE_PAYMASTER.payForGas{ value: msg.value }(
            messageId, // ID of the message that was just dispatched
            HYPERLANE_ADAPTER_CHAIN, // destination domain of the message
            200_000, // gas to use in the recipient's handle function
            msg.sender // refunds go to msg.sender, who paid the msg.value
        );
    }
}
