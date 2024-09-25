// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { HashiProver } from "../prover/HashiProver.sol";

contract HashiProverTest is HashiProver {
    constructor(address shoyuBashi) HashiProver(shoyuBashi) {}

    function getValue(
        HashiProver.AccountProof calldata accountProof,
        HashiProver.StorageProof calldata storageProof
    ) external view returns (bytes[] memory) {
        return _verifyAccountAndStorageProof(accountProof, storageProof);
    }
}
