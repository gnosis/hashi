// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

import { IJushin } from "./IJushin.sol";

/**
 * @title IBouncer
 */
interface IBouncer is IJushin {
    error InvalidAdapters();
    error InvalidSender();
    error InvalidSourceChainId();
    error InvalidThreshold();
    error NotYaru();
}
