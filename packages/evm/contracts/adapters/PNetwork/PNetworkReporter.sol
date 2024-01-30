// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Reporter } from "../Reporter.sol";
import { IErc20Vault } from "./interfaces/IErc20Vault.sol";
import { IPToken } from "./interfaces/IPToken.sol";

contract PNetworkReporter is Reporter, Ownable {
    string public constant PROVIDER = "pnetwork";
    uint256 private constant SWAP_AMOUNT = 1;

    address public immutable VAULT;
    address public immutable TOKEN;

    mapping(uint256 => bytes4) public networkIds;

    error NetworkIdNotAvailable();

    event NetworkIdSet(uint256 indexed chainId, bytes4 indexed networkId);

    constructor(
        address headerStorage,
        address yaho,
        address pNetworkVault,
        address pNetworkToken
    ) Reporter(headerStorage, yaho) {
        VAULT = pNetworkVault;
        TOKEN = pNetworkToken;
    }

    function setNetworkIdByChainId(uint256 chainId, bytes4 networkId) external onlyOwner {
        networkIds[chainId] = networkId;
        emit NetworkIdSet(chainId, networkId);
    }

    function _dispatch(
        uint256 toChainId,
        address adapter,
        uint256[] memory ids,
        bytes32[] memory hashes
    ) internal override returns (bytes32) {
        bytes4 networkId = networkIds[toChainId];
        if (networkId == 0) revert NetworkIdNotAvailable();
        bytes memory payload = abi.encode(ids, hashes);
        if (VAULT != address(0)) {
            IERC20(TOKEN).approve(VAULT, SWAP_AMOUNT);
            IErc20Vault(VAULT).pegIn(SWAP_AMOUNT, TOKEN, _toAsciiString(adapter), payload, networkId);
        } else {
            IPToken(TOKEN).redeem(SWAP_AMOUNT, payload, _toAsciiString(adapter), networkId);
        }
        return bytes32(0);
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

    function _char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
}
