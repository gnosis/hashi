// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { ITelepathyRouter } from "./ITelepathy.sol";
import "../HeaderStorage.sol";

contract TelepathyHeaderReporter {
    uint32 public immutable destinationChainId;
    address public immutable target;
    ITelepathyRouter public immutable router;
    HeaderStorage public immutable headerStorage;

    constructor(ITelepathyRouter _router, HeaderStorage _headerStorage, uint32 _destinationChainId, address _target) {
        router = _router;
        headerStorage = _headerStorage;
        destinationChainId = _destinationChainId;
        target = _target;
    }

    /// @dev Reports the given block header to the oracleAdapter via Telepathy.
    /// @param blockNumber Uint256 block number to pass over Telepathy.
    /// @param msgHash message hash
    function reportHeader(uint256 blockNumber) public returns (bytes32 msgHash) {
        bytes32 blockHeader = headerStorage.storeBlockHeader(blockNumber);
        bytes memory callData = abi.encode(blockNumber, blockHeader);
        msgHash = router.send(destinationChainId, target, callData);
    }
}
