// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { ICrossDomainMessenger } from "./ICrossDomainMessenger.sol";
import { IHeaderStorage } from "../../interfaces/IHeaderStorage.sol";

contract L1CrossDomainMessengerHeaderReporter {
    // The first 1.92 million gas on L2 is free. See here:
    // https://community.optimism.io/docs/developers/bridge/messaging/#for-l1-%E2%87%92-l2-transactions
    uint32 internal constant GAS_LIMIT = 1_920_000;

    ICrossDomainMessenger public immutable l1CrossDomainMessenger;
    IHeaderStorage public immutable headerStorage;

    event HeaderReported(address indexed emitter, uint256 indexed blockNumber, bytes32 indexed blockHeader);

    constructor(ICrossDomainMessenger l1CrossDomainMessenger_, IHeaderStorage headerStorage_) {
        l1CrossDomainMessenger = l1CrossDomainMessenger_;
        headerStorage = headerStorage_;
    }

    /// @dev Reports the given block headers to the oracleAdapter via the L1CrossDomainMessenger.
    /// @param blockNumbers Uint256 array of block number to pass over the L1CrossDomainMessenger.
    /// @param adapter address of L2CrossDomainMessengerAdapter on the destination chain.
    function reportHeaders(uint256[] memory blockNumbers, address adapter) external payable {
        bytes32[] memory blockHeaders = headerStorage.storeBlockHeaders(blockNumbers);
        bytes memory message = abi.encodeWithSignature("storeHashes(uint256[],bytes32[])", blockNumbers, blockHeaders);
        l1CrossDomainMessenger.sendMessage(adapter, message, GAS_LIMIT);
        for (uint256 i = 0; i < blockNumbers.length; i++) {
            emit HeaderReported(address(this), blockNumbers[i], blockHeaders[i]);
        }
    }
}
