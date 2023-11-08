// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IHeaderReporter } from "../interfaces/IHeaderReporter.sol";
import { IYaho } from "../interfaces/IYaho.sol";
import { IHeaderStorage } from "../interfaces/IHeaderStorage.sol";

contract HeaderReporter is IHeaderReporter {
    address public immutable headerStorage;

    constructor(address _headerStorage_) {
        headerStorage = _headerStorage_;
    }

    /// @dev Reports the given block header.
    /// @param blockNumber Uint256 of block number.
    /// @param yaho Address of the Yaho contract to call.
    /// @param toChainIds The destination chain ids.
    /// @param messageRelays Array of relay addresses to which hashes should be relayed.
    /// @param adapters Array of oracle adapter addresses to receive hashes.
    function reportHeader(
        uint256 blockNumber,
        uint256[] calldata toChainIds,
        address[] calldata messageRelays,
        address[] calldata adapters,
        address yaho
    ) external {
        bytes32 blockHeader = IHeaderStorage(headerStorage).storeBlockHeader(blockNumber);
        bytes memory data = abi.encode(blockNumber, blockHeader);

        address[] memory tos = new address[](toChainIds.length);
        for (uint256 i = 0; i < toChainIds.length; ) {
            tos[i] = address(0);
            unchecked {
                ++i;
            }
        }

        IYaho(yaho).dispatchMessagesToAdapters(toChainIds, tos, data, messageRelays, adapters);

        for (uint256 i = 0; i < toChainIds.length; ) {
            emit HeaderReported(toChainIds[i], blockNumber, blockHeader);
            unchecked {
                ++i;
            }
        }
    }
}
