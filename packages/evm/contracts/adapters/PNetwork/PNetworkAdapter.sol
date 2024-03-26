// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC777Recipient } from "@openzeppelin/contracts/interfaces/IERC777Recipient.sol";
import { IERC1820RegistryUpgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC1820RegistryUpgradeable.sol";
import { BlockHashAdapter } from "../BlockHashAdapter.sol";

contract PNetworkAdapter is BlockHashAdapter, Ownable {
    string public constant PROVIDER = "pnetwork";

    address public immutable VAULT;
    address public immutable TOKEN;
    IERC1820RegistryUpgradeable private constant ERC1820 =
        IERC1820RegistryUpgradeable(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
    bytes32 private constant TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");

    mapping(bytes4 => address) public enabledReporters;
    mapping(bytes4 => uint256) public chainIds;

    error InvalidSender(address sender, address expected);
    error InvalidToken(address token, address expected);
    error UnauthorizedPNetworkReceive();

    event ReporterSet(uint256 indexed chainId, bytes4 indexed networkId, address indexed reporter);

    modifier onlySupportedToken(address _tokenAddress) {
        if (_tokenAddress != TOKEN) revert InvalidToken(_tokenAddress, TOKEN);
        _;
    }

    constructor(address pNetworkVault, address pNetworkToken) {
        VAULT = pNetworkVault;
        TOKEN = pNetworkToken;
        ERC1820.setInterfaceImplementer(address(this), TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
    }

    // Implement the ERC777TokensRecipient interface
    function tokensReceived(
        address,
        address from,
        address,
        uint256,
        bytes calldata data,
        bytes calldata
    ) external onlySupportedToken(msg.sender) {
        if (from != VAULT) revert InvalidSender(from, VAULT);
        (, bytes memory userData, bytes4 networkId, address sender) = abi.decode(
            data,
            (bytes1, bytes, bytes4, address)
        );
        if (enabledReporters[networkId] != sender) revert UnauthorizedPNetworkReceive();
        (uint256[] memory ids, bytes32[] memory hashes) = abi.decode(userData, (uint256[], bytes32[]));
        _storeHashes(chainIds[networkId], ids, hashes);
    }

    function setReporterByChain(uint256 chainId, bytes4 networkId, address reporter) external onlyOwner {
        enabledReporters[networkId] = reporter;
        chainIds[networkId] = chainId;
        emit ReporterSet(chainId, networkId, reporter);
    }
}
