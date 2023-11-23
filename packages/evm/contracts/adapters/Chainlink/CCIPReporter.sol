// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IRouterClient } from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import { Client } from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";

abstract contract CCIPReporter {
    string public constant PROVIDER = "ccip";
    IRouterClient public immutable CCIP_ROUTER;
    uint64 public immutable CCIP_ADAPTER_CHAIN;

    constructor(address ccipRouter, uint64 ccipAdapterChain) {
        CCIP_ROUTER = IRouterClient(ccipRouter);
        CCIP_ADAPTER_CHAIN = ccipAdapterChain;
    }

    function _ccipSend(bytes memory payload, address adapter) internal {
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(adapter),
            data: payload,
            tokenAmounts: new Client.EVMTokenAmount[](0), // Empty array - no tokens are transferred
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({ gasLimit: 200_000, strict: false })),
            feeToken: address(0) // Pay fees with native
        });
        CCIP_ROUTER.ccipSend{ value: msg.value }(CCIP_ADAPTER_CHAIN, message);
    }
}
