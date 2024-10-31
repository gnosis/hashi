// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { HashiProver } from "../prover/HashiProver.sol";

contract HashiProverTest is HashiProver {
    constructor(address shoyuBashi) HashiProver(shoyuBashi) {}

    function getStorageValue(HashiProver.AccountAndStorageProof calldata proof) external view returns (bytes[] memory) {
        return verifyForeignStorage(proof);
    }

    function getEventValues(HashiProver.ReceiptProof calldata proof) external view returns (bytes memory) {
        return verifyForeignLog(proof);
    }
}
