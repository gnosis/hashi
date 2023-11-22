// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IRouterClient } from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import { Client } from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import { HeaderReporter } from "../HeaderReporter.sol";

contract ChainlinkReporter is HeaderReporter {
    string public constant PROVIDER = "chainlink";
    address public immutable CHAINLINK_ROUTER;
    uint64 public immutable CHAINLINK_ADAPTER_CHAIN;

    constructor(
        address headerStorage,
        uint64 adapterChain,
        address adapterAddress,
        address chainlinkRouter,
        uint64 chainlinkAdapterChain
    ) HeaderReporter(headerStorage, adapterChain, adapterAddress) {
        CHAINLINK_ROUTER = chainlinkRouter;
        CHAINLINK_ADAPTER_CHAIN = chainlinkAdapterChain;
    }

    function _sendPayload(bytes memory payload) internal virtual override {
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(ADAPTER_ADDRESS),
            data: payload,
            tokenAmounts: new Client.EVMTokenAmount[](0), // Empty array - no tokens are transferred
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({ gasLimit: 200_000, strict: false })),
            feeToken: address(0) // Pay fees with native
        });
        IRouterClient(CHAINLINK_ROUTER).ccipSend{ value: msg.value }(CHAINLINK_ADAPTER_CHAIN, message);
    }
}
