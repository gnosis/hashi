// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { ZetaReceiver, ZetaInterfaces } from "./interfaces/ZetaInterfaces.sol";
import { HeaderOracleAdapter } from "../HeaderOracleAdapter.sol";

contract ZetaAdapter is HeaderOracleAdapter, ZetaReceiver {
    string public constant PROVIDER = "zeta";
    address public immutable ZETA_CONNECTOR;
    bytes public ZETA_REPORTER_ADDRESS; // Immutable
    bytes32 public immutable ZETA_REPORTER_ADDRESS_HASH;

    error UnauthorizedZetaChainReceive();
    error UnauthorizedZetaChainReceiveRevert();

    constructor(
        uint256 reporterChain,
        address reporterAddress,
        address zetaConnector,
        bytes memory zetaReporterAddress
    ) HeaderOracleAdapter(reporterChain, reporterAddress) {
        ZETA_CONNECTOR = zetaConnector;
        ZETA_REPORTER_ADDRESS = zetaReporterAddress;
        ZETA_REPORTER_ADDRESS_HASH = keccak256(zetaReporterAddress);
    }

    function onZetaMessage(ZetaInterfaces.ZetaMessage calldata zetaMessage) external {
        // Auth adapted from "ZetaInteractor" contract's "isValidMessageCall" modifier
        if (
            msg.sender != ZETA_CONNECTOR ||
            zetaMessage.sourceChainId != REPORTER_CHAIN ||
            keccak256(zetaMessage.zetaTxSenderAddress) != ZETA_REPORTER_ADDRESS_HASH
        ) revert UnauthorizedZetaChainReceive();
        _receivePayload(zetaMessage.message);
    }

    function onZetaRevert(ZetaInterfaces.ZetaRevert calldata zetaRevert) external {
        // Auth adapted from "ZetaInteractor" contract's "isValidRevertCall" modifier
        if (
            msg.sender != ZETA_CONNECTOR ||
            zetaRevert.sourceChainId != block.chainid ||
            zetaRevert.zetaTxSenderAddress != address(this)
        ) revert UnauthorizedZetaChainReceiveRevert();
        _receivePayload(zetaRevert.message);
    }
}
