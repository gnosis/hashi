// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { HashiProverUpgradeable } from "../prover/HashiProverUpgradeable.sol";
import "../prover/HashiProverStructs.sol";

contract HashiProverTestUpgradeable is UUPSUpgradeable, HashiProverUpgradeable {
    function initialize(address shoyuBashi) public initializer {
        __UUPSUpgradeable_init();
        __HashiProverUpgradeable_init(shoyuBashi);
    }

    function getStorageValue(AccountAndStorageProof calldata proof) external view returns (bytes[] memory) {
        return verifyForeignStorage(proof);
    }

    function getEventValues(ReceiptProof calldata proof) external view returns (bytes memory) {
        return verifyForeignEvent(proof);
    }

    function getSolanaAccount(SolanaAccountProof calldata proof) external view returns (bytes memory) {
        return verifyForeignSolanaAccount(proof);
    }

    function _authorizeUpgrade(address) internal override {}
}
