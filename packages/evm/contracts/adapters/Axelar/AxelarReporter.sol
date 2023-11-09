// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IAxelarGateway } from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol";
import { IAxelarGasService } from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";
import { HeaderReporter } from "../HeaderReporter.sol";

contract AxelarReporter is HeaderReporter {
    string public constant PROVIDER = "axelar";
    address public immutable AXELAR_GATEWAY;
    address public immutable AXELAR_GAS_SERVICE;
    string public AXELAR_ADAPTER_CHAIN; // Immutable
    string public AXELAR_ADAPTER_ADDRESS; // Immutable

    constructor(
        address headerStorage,
        uint256 adapterChain,
        address adapterAddress,
        address axelarGateway,
        address axelarGasService,
        string memory axelarAdapterChain,
        string memory axelarAdapterAddress
    ) HeaderReporter(headerStorage, adapterChain, adapterAddress) {
        require(
            axelarGateway != address(0) &&
                axelarGasService != address(0) &&
                bytes(axelarAdapterChain).length > 0 &&
                bytes(axelarAdapterAddress).length > 0,
            "AR: invalid ctor call"
        );
        AXELAR_GATEWAY = axelarGateway;
        AXELAR_GAS_SERVICE = axelarGasService;
        AXELAR_ADAPTER_CHAIN = axelarAdapterChain;
        AXELAR_ADAPTER_ADDRESS = axelarAdapterAddress;
    }

    function _sendPayload(bytes memory payload) internal virtual override {
        if (msg.value > 0) {
            IAxelarGasService(AXELAR_GAS_SERVICE).payNativeGasForContractCall{ value: msg.value }(
                address(this),
                AXELAR_ADAPTER_CHAIN,
                AXELAR_ADAPTER_ADDRESS,
                payload,
                msg.sender
            );
        }

        IAxelarGateway(AXELAR_GATEWAY).callContract(AXELAR_ADAPTER_CHAIN, AXELAR_ADAPTER_ADDRESS, payload);
    }
}
