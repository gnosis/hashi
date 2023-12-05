// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/interfaces/IERC777Recipient.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC1820RegistryUpgradeable.sol";

abstract contract PNetworkBase is IERC777Recipient {
    mapping(uint256 => bytes4) public SUPPORTED_NETWORK_IDS;
    uint256 public immutable PNETWORK_REF_CHAIN;
    IERC1820RegistryUpgradeable private constant ERC1820 =
        IERC1820RegistryUpgradeable(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
    bytes32 private constant TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");

    constructor(uint256 pNetworkRefChain) {
        SUPPORTED_NETWORK_IDS[1] = 0x005fe7f9; // EthereumMainnet
        SUPPORTED_NETWORK_IDS[64] = 0x00e4b170; // BscMainnet
        SUPPORTED_NETWORK_IDS[100] = 0x00f1918e; // GnosisMainnet
        SUPPORTED_NETWORK_IDS[137] = 0x0075dd4c; // PolygonMainnet
        SUPPORTED_NETWORK_IDS[42161] = 0x00ce98c4; // ArbitrumMainnet
        require(SUPPORTED_NETWORK_IDS[pNetworkRefChain] != 0, "Not supported chain");
        PNETWORK_REF_CHAIN = pNetworkRefChain;
        ERC1820.setInterfaceImplementer(address(this), TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
    }
}
