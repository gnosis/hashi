// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMailbox } from "@hyperlane-xyz/core/contracts/interfaces/IMailbox.sol";
import { TypeCasts } from "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";

abstract contract HyperlaneReporter {
    using TypeCasts for address;

    string public constant PROVIDER = "hyperlane";
    IMailbox public immutable HYPERLANE_MAILBOX;
    uint32 public immutable HYPERLANE_ADAPTER_CHAIN;

    constructor(address hyperlaneMailbox, uint32 hyperlaneAdapterChain) {
        HYPERLANE_MAILBOX = IMailbox(hyperlaneMailbox);
        HYPERLANE_ADAPTER_CHAIN = hyperlaneAdapterChain;
    }

    function _hyperlaneSend(bytes memory payload, address adapter) internal {
        HYPERLANE_MAILBOX.dispatch{ value: msg.value }(
            HYPERLANE_ADAPTER_CHAIN, // _destinationDomain
            adapter.addressToBytes32(), // _recipientAddress
            payload // _messageBody
        );
    }
}
