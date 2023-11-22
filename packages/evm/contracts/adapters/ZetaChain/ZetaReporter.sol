// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ZetaConnector, ZetaTokenConsumer, ZetaInterfaces } from "./interfaces/ZetaInterfaces.sol";
import { HeaderReporter } from "../HeaderReporter.sol";

contract ZetaReporter is HeaderReporter {
    using SafeERC20 for IERC20;

    string public constant PROVIDER = "zeta";
    address public immutable ZETA_CONNECTOR;
    address public immutable ZETA_TOKEN;
    address public immutable ZETA_CONSUMER;
    bytes public ZETA_ADAPTER_ADDRESS;

    constructor(
        address headerStorage,
        uint256 adapterChain,
        address adapterAddress,
        address zetaConnector,
        address zetaToken,
        address zetaConsumer,
        bytes memory zetaAdapterAddress
    ) HeaderReporter(headerStorage, adapterChain, adapterAddress) {
        ZETA_CONNECTOR = zetaConnector;
        ZETA_TOKEN = zetaToken;
        ZETA_CONSUMER = zetaConsumer;
        ZETA_ADAPTER_ADDRESS = zetaAdapterAddress;
    }

    function _sendPayload(bytes memory payload) internal override {
        uint256 zetaAmount = ZetaTokenConsumer(ZETA_CONSUMER).getZetaFromEth{ value: msg.value }(address(this), 0);
        IERC20(ZETA_TOKEN).safeApprove(ZETA_CONNECTOR, zetaAmount);

        // solhint-disable-next-line check-send-result
        ZetaConnector(ZETA_CONNECTOR).send(
            ZetaInterfaces.SendInput({
                destinationChainId: ADAPTER_CHAIN,
                destinationAddress: ZETA_ADAPTER_ADDRESS,
                destinationGasLimit: 200_000,
                message: payload,
                zetaValueAndGas: zetaAmount,
                zetaParams: abi.encode("")
            })
        );
    }
}
