// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "../HeaderStorage.sol";
import "./IAMB.sol";

contract AMBHeaderReporter {
    IAMB public immutable amb;
    address public oracleAdapter;
    HeaderStorage public immutable headerStorage;

    constructor(IAMB _amb, HeaderStorage _headerStorage) {
        amb = _amb;
        headerStorage = _headerStorage;
    }

    /// @dev Reports the given block header to the oracleAdapter via the AMB.
    /// @param blockNumber Uint256 block number to pass over the AMB.
    /// @param receipt Bytes32 receipt for the transaction.
    function reportHeader(uint256 blockNumber, uint256 gas) public returns (bytes32 receipt) {
        bytes32 blockHeader = headerStorage.storeBlockHeader(blockNumber);
        bytes memory data = abi.encodeWithSignature("storeBlockHeader(uint256,bytes32)", blockNumber, blockHeader);
        receipt = amb.requireToPassMessage(oracleAdapter, data, gas);
    }
}
