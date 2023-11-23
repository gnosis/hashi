// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IAxelarGateway } from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol";
import { IAxelarGasService } from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

abstract contract AxelarReporter {
    using Strings for uint256;

    string public constant PROVIDER = "axelar";
    IAxelarGateway public immutable AXELAR_GATEWAY;
    IAxelarGasService public immutable AXELAR_GAS_SERVICE;
    string public AXELAR_ADAPTER_CHAIN; // Immutable

    constructor(address axelarGateway, address axelarGasService, string memory axelarAdapterChain) {
        AXELAR_GATEWAY = IAxelarGateway(axelarGateway);
        AXELAR_GAS_SERVICE = IAxelarGasService(axelarGasService);
        AXELAR_ADAPTER_CHAIN = axelarAdapterChain;
    }

    function _axelarSend(bytes memory payload, address adapter) internal {
        string memory sAdapter = uint256(uint160(adapter)).toHexString(20);

        if (msg.value > 0) {
            AXELAR_GAS_SERVICE.payNativeGasForContractCall{ value: msg.value }(
                address(this),
                AXELAR_ADAPTER_CHAIN,
                sAdapter,
                payload,
                msg.sender
            );
        }

        AXELAR_GATEWAY.callContract(AXELAR_ADAPTER_CHAIN, sAdapter, payload);
    }
}
