// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

interface IPToken {
    function redeem(
        uint256 amount,
        bytes memory userData,
        string memory underlyingAssetRecipient,
        bytes4 destinationChainId
    ) external;
}
