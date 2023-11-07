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

    /// @dev Reports the given block headers.
    /// @param blockNumbers Uint256 array of block number.
    /// @param yaho Address of the Yaho contract to call.
    /// @param toChainIds The destination chain ids.
    /// @param adapters Array of relay adapter addresses to which hashes should be relayed.
    /// @param destinationAdapters Array of oracle adapter addresses to receive hashes.
    function reportHeaders(
        uint256[] calldata blockNumbers,
        uint256[] calldata toChainIds,
        address[] calldata adapters,
        address[] calldata destinationAdapters,
        address yaho
    ) external {
        bytes32[] memory blockHeaders = IHeaderStorage(headerStorage).storeBlockHeaders(blockNumbers);
        bytes memory data = abi.encode(blockNumbers, blockHeaders);

        address[] memory tos = new address[](toChainIds.length);
        for (uint256 i = 0; i < toChainIds.length; ) {
            tos[i] = address(0);
            unchecked {
                ++i;
            }
        }

        IYaho(yaho).dispatchMessagesToAdapters(toChainIds, tos, data, adapters, destinationAdapters);

        for (uint256 i = 0; i < blockNumbers.length; ) {
            emit HeaderReported(toChainIds[i], blockNumbers[i], blockHeaders[i]);
            unchecked {
                ++i;
            }
        }
    }
}
