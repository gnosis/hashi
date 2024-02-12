// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { IReporter } from "./IReporter.sol";
import { IAdapter } from "./IAdapter.sol";

struct Message {
    uint256 nonce;
    uint256 targetChainId;
    uint256 threshold;
    address sender;
    address receiver;
    bytes data;
    IReporter[] reporters;
    IAdapter[] adapters;
}
