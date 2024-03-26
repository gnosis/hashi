// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Reporter } from "../Reporter.sol";
import { AMBAdapter } from "./AMBAdapter.sol";
import { IAdapter } from "../../interfaces/IAdapter.sol";
import { IAMB } from "./IAMB.sol";

contract AMBReporter is Reporter {
    string public constant PROVIDER = "amb";

    address public immutable AMB;
    uint256 public immutable GAS;
    uint256 public immutable TARGET_CHAIN_ID;

    error InvalidToChainId(uint256 chainId, uint256 expectedChainId);

    constructor(
        address headerStorage,
        address yaho,
        address amb,
        uint256 targetChainId,
        uint256 gas
    ) Reporter(headerStorage, yaho) {
        AMB = amb;
        TARGET_CHAIN_ID = targetChainId;
        GAS = gas;
    }

    function _dispatch(
        uint256 targetChainId,
        address adapter,
        uint256[] memory ids,
        bytes32[] memory hashes
    ) internal override returns (bytes32) {
        if (targetChainId != TARGET_CHAIN_ID) revert InvalidToChainId(targetChainId, TARGET_CHAIN_ID);
        bytes memory payload = abi.encodeCall(AMBAdapter.storeHashes, (ids, hashes));
        return IAMB(AMB).requireToPassMessage(adapter, payload, GAS);
    }
}
