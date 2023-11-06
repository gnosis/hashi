// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IYaho } from "../interfaces/IYaho.sol";
import { IHeaderStorage } from "../interfaces/IHeaderStorage.sol";

contract HeaderReporter {
    address public immutable headerStorage;

    event HeaderReported(uint256 indexed toChainId, uint256 indexed blockNumber, bytes32 indexed blockHeader);

    constructor(address _headerStorage_) {
        headerStorage = _headerStorage_;
    }

    /// @dev Reports the given block headers.
    /// @param blockNumbers Uint256 array of block number.
    /// @param yaho Address of the Yaho contract to call.
    /// @param toChainIds The destination chain ids.
    /// @param tos The target contracts.
    /// @param adapters Array of relay adapter addresses to which hashes should be relayed.
    /// @param destinationAdapters Array of oracle adapter addresses to receive hashes.
    function reportHeaders(
        uint256[] calldata blockNumbers,
        address yaho,
        uint256[] calldata toChainIds,
        address[] calldata tos,
        address[] calldata adapters,
        address[] calldata destinationAdapters
    ) external {
        bytes32[] memory blockHeaders = IHeaderStorage(headerStorage).storeBlockHeaders(blockNumbers);
        bytes[] memory data = new bytes[](1);
        data[0] = abi.encode(blockNumbers, blockHeaders);
        IYaho(yaho).dispatchMessagesToAdapters(toChainIds, tos, data, adapters, destinationAdapters);

        for (uint256 i = 0; i < blockNumbers.length; ) {
            emit HeaderReported(toChainIds[i], blockNumbers[i], blockHeaders[i]);
            unchecked {
                ++i;
            }
        }
    }
}
