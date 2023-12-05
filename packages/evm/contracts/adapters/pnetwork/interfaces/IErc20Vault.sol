// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

interface IErc20Vault {
    function pegIn(
        uint256 tokenAmount,
        address tokenAddress,
        string memory destinationAddress,
        bytes memory userData,
        bytes4 destinationChainId
    ) external returns (bool);
}
