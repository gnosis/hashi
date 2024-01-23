// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IReporter } from "./IReporter.sol";
import { IOracleAdapter } from "./IOracleAdapter.sol";

struct Message {
    bytes32 salt;
    uint256 toChainId;
    uint256 threshold;
    address sender;
    address receiver;
    bytes data;
    IReporter[] reporters;
    IOracleAdapter[] adapters;
}
