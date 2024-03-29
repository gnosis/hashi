// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Reporter } from "../Reporter.sol";
import { IAdapter } from "../../interfaces/IAdapter.sol";
import { ICrossDomainMessenger } from "./interfaces/ICrossDomainMessenger.sol";

contract L1CrossDomainMessengerReporter is Reporter {
    string public constant PROVIDER = "optimism";
    // The first 1.92 million gas on L2 is free. See here:
    // https://community.optimism.io/docs/developers/bridge/messaging/#for-l1-%E2%87%92-l2-transactions
    uint32 internal constant GAS_LIMIT = 1_920_000;

    ICrossDomainMessenger public immutable L1_CROSS_DOMAIN_MESSENGER;
    uint256 public immutable TARGET_CHAIN_ID;

    error InvalidToChainId(uint256 chainId, uint256 expectedChainId);

    constructor(
        address headerStorage,
        address yaho,
        address l1CrossDomainMessenger,
        uint256 targetChainId
    ) Reporter(headerStorage, yaho) {
        L1_CROSS_DOMAIN_MESSENGER = ICrossDomainMessenger(l1CrossDomainMessenger);
        TARGET_CHAIN_ID = targetChainId;
    }

    function _dispatch(
        uint256 targetChainId,
        address adapter,
        uint256[] memory ids,
        bytes32[] memory hashes
    ) internal override returns (bytes32) {
        if (targetChainId != TARGET_CHAIN_ID) revert InvalidToChainId(targetChainId, TARGET_CHAIN_ID);
        bytes memory message = abi.encodeWithSignature("storeHashes(uint256[],bytes32[])", ids, hashes);
        L1_CROSS_DOMAIN_MESSENGER.sendMessage(adapter, message, GAS_LIMIT);
        return bytes32(0);
    }
}
