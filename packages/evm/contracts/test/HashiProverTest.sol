// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { HashiProver } from "../prover/HashiProver.sol";
import "../prover/HashiProverStructs.sol";

contract HashiProverTest is HashiProver {
    constructor(address shoyuBashi) HashiProver(shoyuBashi) {}

    function getStorageValue(AccountAndStorageProof calldata proof) external view returns (bytes[] memory) {
        return verifyForeignStorage(proof);
    }

    function getEventValues(ReceiptProof calldata proof) external view returns (bytes memory) {
        return verifyForeignEvent(proof);
    }

    function getSolanaAccount(SolanaAccountProof calldata proof) external view returns (bytes memory) {
        return verifyForeignSolanaAccount(proof);
    }
}
