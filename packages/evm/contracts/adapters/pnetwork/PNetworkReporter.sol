// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { IErc20Vault } from "./interfaces/IErc20Vault.sol";
import { IPToken } from "./interfaces/IPToken.sol";
import { PNetworkBase } from "./PNetworkBase.sol";

abstract contract PNetworkReporter is PNetworkBase {
    uint256 private constant SWAP_AMOUNT = 100;

    constructor(
        address pNetworkVault,
        address pNetworkToken,
        bytes4 pNetworkAdapterNetworkId
    ) PNetworkBase(pNetworkVault, pNetworkToken, pNetworkAdapterNetworkId) {}

    function _char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }

    function _pNetworkSend(bytes memory payload, address adapter) internal {
        if (VAULT != address(0)) {
            IERC20(TOKEN).approve(VAULT, SWAP_AMOUNT);
            IErc20Vault(VAULT).pegIn(SWAP_AMOUNT, TOKEN, _toAsciiString(adapter), payload, PNETWORK_REF_NETWORK_ID);
        } else {
            IPToken(TOKEN).redeem(SWAP_AMOUNT, payload, _toAsciiString(adapter), PNETWORK_REF_NETWORK_ID);
        }
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
