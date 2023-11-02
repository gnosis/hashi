// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageRelay } from "../../interfaces/IMessageRelay.sol";
import { IErc20Vault } from "./IErc20Vault.sol";
import { IPToken } from "./IPToken.sol";
import { Yaho } from "../../Yaho.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/IERC1820RegistryUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777.sol";

contract PNetworkMessageRelay is IMessageRelay {
    bytes32 private constant TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");
    IERC1820RegistryUpgradeable private constant _erc1820 =
        IERC1820RegistryUpgradeable(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);

    address public immutable token;
    address public immutable vault;
    Yaho public immutable yaho;
    bytes4[] private _supportedNetworkIds;

    uint256 private constant SWAP_AMOUNT = 100;

    event MessageRelayed(address indexed emitter, uint256 indexed messageId);
    event NetworkIdAdded(bytes4 networkId);

    error AlreadyExistingNetworkId(bytes4 networkId);

    constructor(address _vault, address _token, Yaho _yaho) {
        vault = _vault;
        token = _token;
        yaho = _yaho;
        _erc1820.setInterfaceImplementer(address(this), TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
    }

    // TODO: limit access to this function
    function addNetwork(bytes4 networkId) public {
        if (_isNetworkSupported(networkId)) revert AlreadyExistingNetworkId(networkId);
        _supportedNetworkIds.push(networkId);
        emit NetworkIdAdded(networkId);
    }

    function relayMessages(
        uint256[] memory messageIds,
        address pnetworkAdapter
    ) public payable returns (bytes32 receipt) {
        bytes32[] memory hashes = new bytes32[](messageIds.length);
        for (uint256 i = 0; i < messageIds.length; i++) {
            uint256 id = messageIds[i];
            hashes[i] = yaho.hashes(id);
            emit MessageRelayed(address(this), messageIds[i]);
        }
        bytes memory userData = abi.encode(messageIds, hashes);
        if (vault != address(0)) {
            for (uint256 index = 0; index < _supportedNetworkIds.length; index++) {
                IERC20(token).approve(vault, SWAP_AMOUNT);
                IErc20Vault(vault).pegIn(
                    SWAP_AMOUNT,
                    token,
                    _toAsciiString(pnetworkAdapter),
                    userData,
                    _supportedNetworkIds[index]
                );
            }
        } else {
            for (uint256 index = 0; index < _supportedNetworkIds.length; index++) {
                IPToken(token).redeem(
                    SWAP_AMOUNT,
                    userData,
                    _toAsciiString(pnetworkAdapter),
                    _supportedNetworkIds[index]
                );
            }
        }
        // TODO: return something resembling a receipt
    }

    /**
     * @dev Implementation of IERC777Recipient.
     */
    function tokensReceived(
        address /*operator*/,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata /*operatorData*/
    ) external onlySupportedToken(msg.sender) {
        require(to == address(this), "Token receiver is not this contract");
    }

    modifier onlySupportedToken(address _tokenAddress) {
        require(_tokenAddress == token, "Token at supplied address is NOT supported!");
        _;
    }

    function _char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }

    function _isNetworkSupported(bytes4 _target) internal view returns (bool) {
        for (uint i = 0; i < _supportedNetworkIds.length; i++) {
            if (_supportedNetworkIds[i] == _target) {
                return true; // Value found in the array
            }
        }
        return false; // Value not found in the array
    }

    function _toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2 ** (8 * (19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2 * i] = _char(hi);
            s[2 * i + 1] = _char(lo);
        }
        return string(s);
    }
}
