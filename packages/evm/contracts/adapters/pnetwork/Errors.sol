// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

library Errors {
    error ArrayLengthMismatch();
    error InvalidToken(address token, address expected);
    error InvalidSender(address sender, address expected);
    error InvalidReceiver(address receiver, address expected);
    error InvalidNetworkId(bytes4 networkId, bytes4 expected);
    error UnauthorizedPNetworkReceive();
}
