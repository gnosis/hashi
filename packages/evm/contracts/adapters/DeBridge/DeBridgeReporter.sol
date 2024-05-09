// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Reporter } from "../Reporter.sol";
import { IDeBridgeGate } from "./interfaces/IDeBridgeGate.sol";

contract DeBridgeReporter is Reporter, Ownable {
    string public constant PROVIDER = "debridge";

    IDeBridgeGate public immutable deBridgeGate;
    uint256 fee;

    event FeeSet(uint256 fee);

    constructor(address headerStorage, address yaho, address _deBridgeGate) Reporter(headerStorage, yaho) {
        deBridgeGate = IDeBridgeGate(_deBridgeGate);
    }

    function setFee(uint256 fee_) external onlyOwner {
        fee = fee_;
        emit FeeSet(fee);
    }

    function _dispatch(
        uint256 targetChainId,
        address adapter,
        uint256[] memory ids,
        bytes32[] memory hashes
    ) internal override returns (bytes32) {
        bytes32 submissionId = deBridgeGate.sendMessage{ value: fee }(
            targetChainId,
            abi.encodePacked(adapter),
            abi.encodeWithSignature("storeHashes(uint256[],bytes32[])", ids, hashes)
        );
        return submissionId;
    }
}
