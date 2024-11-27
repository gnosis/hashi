// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { BlockHashAdapter } from "../BlockHashAdapter.sol";
import { IReceiverGateway } from "./interfaces/IReceiverGateway.sol";

contract VeaAdapter is IReceiverGateway, BlockHashAdapter {
    string public constant PROVIDER = "vea";

    address public immutable VEA_OUTBOX;
    address public immutable REPORTER;
    uint256 public immutable SOURCE_CHAIN_ID;

    error ArrayLengthMissmatch();
    error InvalidVeaOutbox(address veaOutbox, address expectedVeaOutboux);
    error InvalidReporter(address reporter, address expectedReporter);

    constructor(address veaOutbox_, address reporter, uint256 sourceChainId) {
        VEA_OUTBOX = veaOutbox_;
        REPORTER = reporter;
        SOURCE_CHAIN_ID = sourceChainId;
    }

    modifier onlyFromAuthenticatedVeaSender(address sourceMsgSender) {
        if (msg.sender != VEA_OUTBOX) revert InvalidVeaOutbox(msg.sender, VEA_OUTBOX);
        if (sourceMsgSender != REPORTER) revert InvalidReporter(REPORTER, sourceMsgSender);
        _;
    }

    function senderGateway() external view override returns (address) {
        return REPORTER;
    }

    function veaOutbox() external view override returns (address) {
        return VEA_OUTBOX;
    }

    function storeHashes(
        address sourceMsgSender,
        uint256[] memory ids,
        bytes32[] memory _hashes
    ) external onlyFromAuthenticatedVeaSender(sourceMsgSender) {
        if (ids.length != _hashes.length) revert ArrayLengthMissmatch();
        _storeHashes(uint256(SOURCE_CHAIN_ID), ids, _hashes);
    }
}
