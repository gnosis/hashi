// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

struct Message {
    uint256 fromChainId;
    uint256 toChainId;
    address from;
    address to;
    bytes data;
}
