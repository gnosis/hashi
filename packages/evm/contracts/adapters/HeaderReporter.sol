// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IHeaderReporter } from "../interfaces/IHeaderReporter.sol";
import { HeaderStorage } from "../utils/HeaderStorage.sol";

abstract contract HeaderReporter is IHeaderReporter {
    HeaderStorage public immutable HEADER_STORAGE;
    uint256 public immutable ADAPTER_CHAIN;

    event HeaderReported(address indexed emitter, uint256 indexed blockNumber, bytes32 indexed blockHeader);

    /// @dev Constructs base reporter abstracted from specific message transport
    /// @param headerStorage HeaderStorage contract on this chain to use for block hash obtaining
    /// @param adapterChain Chain ID of the adapter that is served by this reporter
    constructor(address headerStorage, uint256 adapterChain) {
        HEADER_STORAGE = HeaderStorage(headerStorage);
        ADAPTER_CHAIN = adapterChain;
    }

    function reportHeaders(uint256[] memory blockNumbers, address adapter) external payable {
        bytes32[] memory blockHeaders = HEADER_STORAGE.storeBlockHeaders(blockNumbers);
        bytes memory payload = abi.encode(blockNumbers, blockHeaders);
        _sendPayload(payload, adapter);
        for (uint i = 0; i < blockNumbers.length; i++) {
            emit HeaderReported(address(this), blockNumbers[i], blockHeaders[i]);
        }
    }

    function _sendPayload(bytes memory payload, address adapter) internal virtual;
}
