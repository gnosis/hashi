// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { HeaderStorage } from "../../utils/HeaderStorage.sol";
import { IWormhole } from "./IWormhole.sol";

contract WormholeHeaderReporter {
    IWormhole public immutable wormhole;
    address public oracleAdapter;
    HeaderStorage public immutable headerStorage;

    constructor(IWormhole _wormhole, HeaderStorage _headerStorage) {
        wormhole = _wormhole;
        headerStorage = _headerStorage;
    }

    /// @dev Reports the given block header to the oracleAdapter via the Wormhole.
    /// @param blockNumber Uint256 block number to pass over the Wormhole.
    /// @param sequence Uint64 value used to retrive generated VAA from the wormhole network.
    function reportHeader(uint256 blockNumber) public returns (uint64 sequence) {
        bytes32 blockHeader = headerStorage.storeBlockHeader(blockNumber);
        bytes memory payload = abi.encodeWithSignature("storeBlockHeader(uint256,bytes32)", blockNumber, blockHeader);
        uint32 nonce = 0;
        uint8 consistencyLevel = 201;
        sequence = wormhole.publishMessage(nonce, payload, consistencyLevel);
    }
}
