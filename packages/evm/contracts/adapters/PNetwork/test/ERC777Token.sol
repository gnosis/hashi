// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";

contract ERC777Token is ERC777 {
    constructor(
        string memory name,
        string memory symbol,
        address[] memory defaultOperators
    ) ERC777(name, symbol, defaultOperators) {
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
}
