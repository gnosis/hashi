// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IHeaderStorage } from "../../interfaces/IHeaderStorage.sol";
import { IWormhole } from "./IWormhole.sol";

contract WormholeHeaderReporter {
    IWormhole public immutable wormhole;
    IHeaderStorage public immutable headerStorage;

    constructor(IWormhole wormhole_, IHeaderStorage headerStorage_) {
        wormhole = wormhole_;
        headerStorage = headerStorage_;
    }

    /// @dev Reports the given block header to the adapter via the Wormhole.
    /// @param blockNumbers Uint256 array of block numbers to pass over the Wormhole.
    /// @param sequence Uint64 value used to retrive generated VAA from the wormhole network.
    function reportHeaders(uint256[] calldata blockNumbers) external returns (uint64 sequence) {
        bytes32[] memory blockHeaders = new bytes32[](blockNumbers.length);
        for (uint256 i = 0; i < blockNumbers.length; i++) {
            blockHeaders[i] = headerStorage.storeBlockHeader(blockNumbers[i]);
        }
        bytes memory payload = abi.encode(blockNumbers, blockHeaders);
        uint32 nonce = 0;
        uint8 consistencyLevel = 201;
        sequence = wormhole.publishMessage(nonce, payload, consistencyLevel);
    }
}
