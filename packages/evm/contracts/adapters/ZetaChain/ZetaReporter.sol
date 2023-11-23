// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ZetaConnector, ZetaTokenConsumer, ZetaInterfaces } from "./interfaces/ZetaInterfaces.sol";

abstract contract ZetaReporter {
    using SafeERC20 for IERC20;

    string public constant PROVIDER = "zeta";
    ZetaConnector public immutable ZETA_CONNECTOR;
    address public immutable ZETA_TOKEN;
    ZetaTokenConsumer public immutable ZETA_CONSUMER;
    uint256 public immutable ZETA_ADAPTER_CHAIN;

    constructor(address zetaConnector, address zetaToken, address zetaConsumer, uint256 zetaAdapterChain) {
        ZETA_CONNECTOR = ZetaConnector(zetaConnector);
        ZETA_TOKEN = zetaToken;
        ZETA_CONSUMER = ZetaTokenConsumer(zetaConsumer);
        ZETA_ADAPTER_CHAIN = zetaAdapterChain;
    }

    function _zetaSend(bytes memory payload, address adapter) internal {
        uint256 zetaAmount = ZETA_CONSUMER.getZetaFromEth{ value: msg.value }(address(this), 0);
        IERC20(ZETA_TOKEN).safeApprove(address(ZETA_CONNECTOR), zetaAmount);

        // solhint-disable-next-line check-send-result
        ZETA_CONNECTOR.send(
            ZetaInterfaces.SendInput({
                destinationChainId: ZETA_ADAPTER_CHAIN,
                destinationAddress: abi.encodePacked(adapter),
                destinationGasLimit: 200_000,
                message: payload,
                zetaValueAndGas: zetaAmount,
                zetaParams: abi.encode("")
            })
        );
    }
}
