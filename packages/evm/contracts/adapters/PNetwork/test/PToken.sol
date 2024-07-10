// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";

contract PToken is ERC777 {
    bytes4 public ORIGIN_CHAIN_ID;

    event Redeem(
        address indexed redeemer,
        uint256 value,
        string underlyingAssetRecipient,
        bytes userData,
        bytes4 originChainId,
        bytes4 destinationChainId
    );

    constructor(
        string memory name,
        string memory symbol,
        address[] memory defaultOperators
    ) ERC777(name, symbol, defaultOperators) {
        ORIGIN_CHAIN_ID = 0x87654321;
        _mint(msg.sender, 1000000, "", "");
    }

    function mint(
        address recipient,
        uint256 value,
        bytes memory userData,
        bytes memory operatorData
    ) public returns (bool) {
        require(recipient != address(this), "Recipient cannot be the token contract address!");
        _mint(recipient, value, userData, operatorData);
        return true;
    }

    function redeem(
        uint256 amount,
        bytes memory userData,
        string memory underlyingAssetRecipient,
        bytes4 destinationChainId
    ) public {
        _burn(_msgSender(), amount, userData, "");
        emit Redeem(msg.sender, amount, underlyingAssetRecipient, userData, ORIGIN_CHAIN_ID, destinationChainId);
    }
}
