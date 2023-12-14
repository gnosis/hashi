// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/interfaces/IERC777Recipient.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC1820RegistryUpgradeable.sol";

abstract contract PNetworkBase is IERC777Recipient {
    address public immutable VAULT;
    address public immutable TOKEN;
    bytes4 public immutable PNETWORK_REF_NETWORK_ID;
    IERC1820RegistryUpgradeable private constant ERC1820 =
        IERC1820RegistryUpgradeable(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
    bytes32 private constant TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");

    error InvalidToken(address token, address expected);
    error InvalidReceiver(address receiver, address expected);

    constructor(address pNetworkVault, address pNetworkToken, bytes4 pNetworkRefNetworkId) {
        VAULT = pNetworkVault;
        TOKEN = pNetworkToken;
        PNETWORK_REF_NETWORK_ID = pNetworkRefNetworkId;
        ERC1820.setInterfaceImplementer(address(this), TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
    }

    // Implement the ERC777TokensRecipient interface
    function tokensReceived(
        address,
        address,
        address to,
        uint256,
        bytes calldata,
        bytes calldata
    ) external virtual onlySupportedToken(msg.sender) {
        if (to != address(this)) revert InvalidReceiver(to, address(this));
    }

    modifier onlySupportedToken(address _tokenAddress) {
        if (_tokenAddress != TOKEN) revert InvalidToken(_tokenAddress, TOKEN);
        _;
    }
}
