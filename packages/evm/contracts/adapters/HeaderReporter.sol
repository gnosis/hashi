// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IHeaderReporter } from "../interfaces/IHeaderReporter.sol";
import { HeaderStorage } from "../utils/HeaderStorage.sol";

abstract contract HeaderReporter is IHeaderReporter {
    address public immutable HEADER_STORAGE;
    uint256 public immutable ADAPTER_CHAIN;
    address public immutable ADAPTER_ADDRESS;

    /// @dev Constructs base reporter abstracted from specific message transport
    /// @param headerStorage IBlockHashStorage contract on this chain to use for block hash obtaining
    /// @param adapterChain Chain ID of the adapter that is served by this reporter
    /// @param adapterAddress Address of the adapter that is served by this reporter
    constructor(address headerStorage, uint256 adapterChain, address adapterAddress) {
        HEADER_STORAGE = headerStorage;
        ADAPTER_CHAIN = adapterChain;
        ADAPTER_ADDRESS = adapterAddress;
    }

    function reportHeader(uint256 blockNumber) external payable {
        bytes32 blockHash = HeaderStorage(HEADER_STORAGE).storeBlockHeader(blockNumber);
        bytes memory payload = abi.encode(blockNumber, blockHash);
        _sendPayload(payload);
    }

    function _sendPayload(bytes memory payload) internal virtual;
}
