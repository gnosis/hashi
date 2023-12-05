// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC777/presets/ERC777PresetFixedSupply.sol";

import { HeaderOracleAdapter } from "../HeaderOracleAdapter.sol";
import { PNetworkBase } from "./PNetworkBase.sol";

contract PNetworkAdapter is HeaderOracleAdapter, PNetworkBase {
    address public immutable ADMITTED_SENDER;
    address public immutable TOKEN;

    error ArrayLengthMismatch();
    error InvalidSender(address sender);

    constructor(
        uint256 reporterChain,
        address reporterAddress,
        address pNetworkAdmittedsender,
        address pNetworkToken,
        uint32 pNetworkReporterChain
    ) HeaderOracleAdapter(reporterChain, reporterAddress) PNetworkBase(pNetworkReporterChain) {
        ADMITTED_SENDER = pNetworkAdmittedsender;
        TOKEN = pNetworkToken;
    }

    // Implement the ERC777TokensRecipient interface
    function tokensReceived(
        address,
        address from,
        address,
        uint256,
        bytes calldata data,
        bytes calldata
    ) external override {
        require(msg.sender == address(TOKEN), "Only accepted token is allowed");
        if (from != ADMITTED_SENDER) revert InvalidSender(from);
        (, bytes memory userData, bytes4 networkId, address sender) = abi.decode(
            data,
            (bytes1, bytes, bytes4, address)
        );
        require(networkId == SUPPORTED_NETWORK_IDS[PNETWORK_REF_CHAIN], "Invalid source network ID");
        require(sender == REPORTER_ADDRESS, "Invalid reporter");
        _receivePayload(userData);
    }
}
