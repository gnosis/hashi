// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { VeaAdapter } from "./VeaAdapter.sol";
import { Reporter } from "../Reporter.sol";
import { ISenderGateway } from "./interfaces/ISenderGateway.sol";
import { IVeaInbox } from "./interfaces/IVeaInbox.sol";

contract VeaReporter is ISenderGateway, Reporter {
    string public constant PROVIDER = "vea";

    IVeaInbox public immutable VEA_INBOX;
    address public immutable ADAPTER;
    uint256 public immutable EXPECTED_TARGET_CHAIN_ID;

    error InvalidAdapter(address adapter, address expectedAdapter);
    error InvalidTargetChainId(uint256 targetChainId, uint256 expectedTargetChainId);

    constructor(
        address headerStorage,
        address yaho,
        IVeaInbox veaInbox_,
        address adapter,
        uint256 expectedTargetChainId
    ) Reporter(headerStorage, yaho) {
        VEA_INBOX = veaInbox_;
        ADAPTER = adapter;
        EXPECTED_TARGET_CHAIN_ID = expectedTargetChainId;
    }

    function receiverGateway() external view override returns (address) {
        return ADAPTER;
    }

    function veaInbox() external view override returns (IVeaInbox) {
        return VEA_INBOX;
    }

    function _dispatch(
        uint256 targetChainId,
        address adapter,
        uint256[] memory ids,
        bytes32[] memory hashes
    ) internal override returns (bytes32) {
        if (targetChainId != EXPECTED_TARGET_CHAIN_ID)
            revert InvalidTargetChainId(targetChainId, EXPECTED_TARGET_CHAIN_ID);
        if (adapter != ADAPTER) revert InvalidAdapter(adapter, ADAPTER);
        uint64 msgId = VEA_INBOX.sendMessage(ADAPTER, VeaAdapter.storeHashes.selector, abi.encode(ids, hashes));
        return bytes32(uint256(msgId));
    }
}
