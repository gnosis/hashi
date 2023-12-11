// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC777/presets/ERC777PresetFixedSupply.sol";

import { HeaderOracleAdapter } from "../HeaderOracleAdapter.sol";
import { PNetworkBase } from "./PNetworkBase.sol";

contract PNetworkAdapter is HeaderOracleAdapter, PNetworkBase {
    error InvalidSender(address sender, address expected);
    error InvalidNetworkId(bytes4 networkId, bytes4 expected);
    error UnauthorizedPNetworkReceive();

    constructor(
        uint256 reporterChain,
        address reporterAddress,
        address pNetworkVault,
        address pNetworkToken,
        bytes4 pNetworkReporterNetworkId
    )
        HeaderOracleAdapter(reporterChain, reporterAddress)
        PNetworkBase(pNetworkVault, pNetworkToken, pNetworkReporterNetworkId)
    {} // solhint-disable no-empty-blocks

    // Implement the ERC777TokensRecipient interface
    function tokensReceived(
        address,
        address from,
        address,
        uint256,
        bytes calldata data,
        bytes calldata
    ) external override onlySupportedToken(msg.sender) {
        if (from != VAULT) revert InvalidSender(from, VAULT);
        (, bytes memory userData, bytes4 networkId, address sender) = abi.decode(
            data,
            (bytes1, bytes, bytes4, address)
        );
        if (networkId != PNETWORK_REF_NETWORK_ID) revert InvalidNetworkId(networkId, PNETWORK_REF_NETWORK_ID);
        if (sender != REPORTER_ADDRESS) revert UnauthorizedPNetworkReceive();
        _receivePayload(userData);
    }
}
