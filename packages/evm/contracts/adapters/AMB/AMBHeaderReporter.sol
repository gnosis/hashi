// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { HeaderStorage } from "../../utils/HeaderStorage.sol";
import { IAMB } from "./IAMB.sol";
import { AMBAdapter } from "./AMBAdapter.sol";

contract AMBHeaderReporter {
    IAMB public immutable amb;
    HeaderStorage public immutable headerStorage;

    event HeaderReported(address indexed emitter, uint256 indexed blockNumber, bytes32 indexed blockHeader);

    constructor(IAMB _amb, HeaderStorage _headerStorage) {
        amb = _amb;
        headerStorage = _headerStorage;
    }

    /// @dev Reports the given block headers to the oracleAdapter via the AMB.
    /// @param blockNumbers Uint256 array of block number to pass over the AMB.
    /// @param ambAdapter Address of the oracle adapter to pass the header to over the AMB.
    /// @param receipt Bytes32 receipt for the transaction.
    function reportHeaders(
        uint256[] memory blockNumbers,
        address ambAdapter,
        uint256 gas
    ) public returns (bytes32 receipt) {
        bytes32[] memory blockHeaders = headerStorage.storeBlockHeaders(blockNumbers);
        bytes memory data = abi.encodeCall(AMBAdapter.storeHashes, (blockNumbers, blockHeaders));
        receipt = amb.requireToPassMessage(ambAdapter, data, gas);
        for (uint256 i = 0; i < blockNumbers.length; i++) {
            emit HeaderReported(address(this), blockNumbers[i], blockHeaders[i]);
        }
    }
}
