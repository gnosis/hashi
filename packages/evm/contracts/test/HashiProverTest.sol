// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { HashiProver } from "../prover/HashiProver.sol";

contract HashiProverTest is HashiProver {
    constructor(address shoyuBashi) HashiProver(shoyuBashi) {}

    function getValue(HashiProver.AccountAndStorageProof calldata proof) external view returns (bytes[] memory) {
        return _verifyAccountAndStorageProof(proof);
    }
}
