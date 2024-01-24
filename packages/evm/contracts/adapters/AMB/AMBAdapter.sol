// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IAMB } from "./IAMB.sol";
import { OracleAdapter } from "../OracleAdapter.sol";
import { BlockHashOracleAdapter } from "../BlockHashOracleAdapter.sol";

contract AMBAdapter is OracleAdapter, BlockHashOracleAdapter {
    string public constant PROVIDER = "amb";

    IAMB public immutable AMB;
    address public immutable REPORTER;
    bytes32 public immutable SOURCE_CHAIN_ID;

    error ArrayLengthMissmatch();
    error UnauthorizedAMB(address sender, address expectedSender);
    error UnauthorizedChainId(bytes32 sourceChainId, bytes32 expectedSourceChainId);
    error UnauthorizedHashReporter(address reporter, address expectedReporter);

    constructor(IAMB amb, address reporter, bytes32 sourceChainId) {
        AMB = amb;
        REPORTER = reporter;
        SOURCE_CHAIN_ID = sourceChainId;
    }

    modifier onlyValid() {
        bytes32 ambSourceChainId = AMB.messageSourceChainId();
        address ambMessageSender = AMB.messageSender();
        if (msg.sender != address(AMB)) revert UnauthorizedAMB(msg.sender, address(AMB));
        if (ambSourceChainId != SOURCE_CHAIN_ID) revert UnauthorizedChainId(ambSourceChainId, SOURCE_CHAIN_ID);
        if (ambMessageSender != REPORTER) revert UnauthorizedHashReporter(ambMessageSender, REPORTER);
        _;
    }

    function storeHashes(uint256[] memory ids, bytes32[] memory _hashes) public onlyValid {
        if (ids.length != _hashes.length) revert ArrayLengthMissmatch();
        for (uint256 i = 0; i < ids.length; i++) {
            _storeHash(uint256(SOURCE_CHAIN_ID), ids[i], _hashes[i]);
        }
    }
}
