// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IWormhole, VM } from "./IWormhole.sol";
import { OracleAdapter } from "../OracleAdapter.sol";
import { BlockHashOracleAdapter } from "../BlockHashOracleAdapter.sol";

contract WormholeAdapter is OracleAdapter, BlockHashOracleAdapter {
    IWormhole public immutable wormhole;
    bytes32 public immutable reporter;
    uint16 public immutable wormholeSourceChainId;
    uint256 public immutable sourceChainId;

    error InvalidMessage(address emitter, VM vm, string reason);
    error InvalidEmitterChainId(address emitter, uint16 chainId);
    error InvalidReporter(address emitter, bytes32 reporter);

    constructor(IWormhole wormhole_, address reporter_, uint256 sourceChainId_, uint16 wormholeSourceChainId_) {
        wormhole = wormhole_;
        reporter = bytes32(uint256(uint160(reporter_)));
        sourceChainId = sourceChainId_;
        wormholeSourceChainId = wormholeSourceChainId_;
    }

    /// @dev Stores the block header for a given block.
    /// @param encodedVM Encoded data reflecting the content of the Wormhole Verified Action Approval.
    function storeHashByEncodedVM(bytes calldata encodedVM) public {
        (VM memory vm, bool valid, string memory reason) = wormhole.parseAndVerifyVM(encodedVM);
        if (!valid) revert InvalidMessage(address(this), vm, reason);
        if (vm.emitterChainId != wormholeSourceChainId) revert InvalidEmitterChainId(address(this), vm.emitterChainId);
        if (vm.emitterAddress != reporter) revert InvalidReporter(address(this), vm.emitterAddress);
        (uint256 id, bytes32 hash) = abi.decode(vm.payload, (uint256, bytes32));
        _storeHash(sourceChainId, id, hash);
    }
}
