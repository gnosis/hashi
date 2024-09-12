// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Reporter } from "../Reporter.sol";

import { StateMachine } from "@polytope-labs/ismp-solidity/interfaces/StateMachine.sol";
import { BaseIsmpModule } from "@polytope-labs/ismp-solidity/interfaces/IIsmpModule.sol";
import { IDispatcher, DispatchPost } from "@polytope-labs/ismp-solidity/interfaces/IDispatcher.sol";

contract HyperbridgeReporter is Reporter, Ownable, BaseIsmpModule {
    string public constant PROVIDER = "hyperbridge";

    constructor() {
        address host = host();
        address feeToken = IDispatcher(host).feeToken();
        // approve the host to spend infinitely
        IERC20(feeToken).approve(host, type(uint256).max);
    }

    function _dispatch(
        uint256 targetChainId,
        address adapter,
        uint256[] memory ids,
        bytes32[] memory hashes
    ) internal override returns (bytes32) {
        bytes memory payload = abi.encode(ids, hashes);
        DispatchPost memory post = DispatchPost({
            // recipient chain
            dest: StateMachine.evm(targetChainId),
            // recipient contract
            to: abi.encode(adapter),
            // serialized message
            body: payload,
            // no timeouts
            timeout: 0,
            // requests will be self-relayed
            fee: 0, 
            // relayer fee refunds 
            payer: address(this)
        });

        // dispatch cross-chain message, returns request Id
        // without msg.value payments are collected in stablecoins
        return IDispatcher(host()).dispatch(post);
    }
}
