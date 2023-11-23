// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IRouterClient } from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import { Client } from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";

abstract contract ChainlinkReporter {
    string public constant PROVIDER = "chainlink";
    IRouterClient public immutable CHAINLINK_ROUTER;
    uint64 public immutable CHAINLINK_ADAPTER_CHAIN;

    constructor(address chainlinkRouter, uint64 chainlinkAdapterChain) {
        CHAINLINK_ROUTER = IRouterClient(chainlinkRouter);
        CHAINLINK_ADAPTER_CHAIN = chainlinkAdapterChain;
    }

    function _chainlinkSend(bytes memory payload, address adapter) internal {
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(adapter),
            data: payload,
            tokenAmounts: new Client.EVMTokenAmount[](0), // Empty array - no tokens are transferred
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({ gasLimit: 200_000, strict: false })),
            feeToken: address(0) // Pay fees with native
        });
        CHAINLINK_ROUTER.ccipSend{ value: msg.value }(CHAINLINK_ADAPTER_CHAIN, message);
    }
}
