// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { StateMachine } from "@polytope-labs/ismp-solidity/interfaces/StateMachine.sol";
import { BaseIsmpModule } from "@polytope-labs/ismp-solidity/interfaces/IIsmpModule.sol";
import { IDispatcher, DispatchPost } from "@polytope-labs/ismp-solidity/interfaces/IDispatcher.sol";
import { Reporter } from "../Reporter.sol";

contract HyperbridgeReporter is Reporter, Ownable, BaseIsmpModule {
    string public constant PROVIDER = "hyperbridge";

    // @dev The address of the IsmpHost on the current chain
    address private _host;

    constructor(address headerStorage, address yaho, address ismpHost) Reporter(headerStorage, yaho) {
        _host = ismpHost;
        address feeToken = IDispatcher(ismpHost).feeToken();
        // approve the host to spend infinitely
        IERC20(feeToken).approve(ismpHost, type(uint256).max);
    }

    function host() public view override returns (address) {
        return _host;
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
            to: abi.encodePacked(adapter),
            // serialized message
            body: payload,
            // no timeouts
            timeout: 0,
            // requests will be self-relayed
            fee: 0,
            // relayer fee refunds
            payer: address(this)
        });

        // dispatch cross-chain message, returns request id
        return IDispatcher(host()).dispatch(post);
    }
}
