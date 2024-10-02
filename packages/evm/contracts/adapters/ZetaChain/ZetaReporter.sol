// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ZetaConnector, ZetaTokenConsumer, ZetaInterfaces } from "./interfaces/ZetaInterfaces.sol";
import { Reporter } from "../Reporter.sol";

contract ZetaReporter is Reporter, Ownable {
    using SafeERC20 for IERC20;

    string public constant PROVIDER = "zeta";
    ZetaConnector public immutable ZETA_CONNECTOR;
    address public immutable ZETA_TOKEN;
    ZetaTokenConsumer public immutable ZETA_CONSUMER;

    constructor(
        address headerStorage,
        address yaho,
        address zetaConnector,
        address zetaToken,
        address zetaConsumer
    ) Reporter(headerStorage, yaho) {
        ZETA_CONNECTOR = ZetaConnector(zetaConnector);
        ZETA_TOKEN = zetaToken;
        ZETA_CONSUMER = ZetaTokenConsumer(zetaConsumer);
    }

    function _dispatch(
        uint256 targetChainId,
        address adapter,
        uint256[] memory ids,
        bytes32[] memory hashes
    ) internal override returns (bytes32) {
        bytes memory payload = abi.encode(ids, hashes);
        uint256 zetaAmount = ZETA_CONSUMER.getZetaFromEth{ value: msg.value }(address(this), 0);
        IERC20(ZETA_TOKEN).safeApprove(address(ZETA_CONNECTOR), zetaAmount);

        // solhint-disable-next-line check-send-result
        ZETA_CONNECTOR.send(
            ZetaInterfaces.SendInput({
                destinationChainId: targetChainId,
                destinationAddress: abi.encodePacked(adapter),
                destinationGasLimit: 200_000,
                message: payload,
                zetaValueAndGas: zetaAmount,
                zetaParams: abi.encode("")
            })
        );

        return bytes32(0);
    }
}
