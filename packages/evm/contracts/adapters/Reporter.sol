// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { IHeaderStorage } from "../interfaces/IHeaderStorage.sol";
import { IReporter } from "../interfaces/IReporter.sol";
import { IAdapter } from "../interfaces/IAdapter.sol";

abstract contract Reporter is IReporter {
    address public immutable HEADER_STORAGE;
    address public immutable YAHO;

    modifier onlyYaho() {
        if (msg.sender != YAHO) revert NotYaho(msg.sender, YAHO);
        _;
    }

    constructor(address headerStorage, address yaho) {
        HEADER_STORAGE = headerStorage;
        YAHO = yaho;
    }

    /// @inheritdoc IReporter
    function dispatchBlocks(
        uint256 targetChainId,
        IAdapter adapter,
        uint256[] memory blockNumbers
    ) external payable returns (bytes32) {
        bytes32[] memory blockHeaders = IHeaderStorage(HEADER_STORAGE).storeBlockHeaders(blockNumbers);
        for (uint256 i = 0; i < blockNumbers.length; ) {
            emit BlockDispatched(targetChainId, adapter, blockNumbers[i], blockHeaders[i]);
            unchecked {
                ++i;
            }
        }
        return _dispatch(targetChainId, address(adapter), blockNumbers, blockHeaders);
    }

    /// @inheritdoc IReporter
    function dispatchMessages(
        uint256 targetChainId,
        IAdapter adapter,
        uint256[] memory messageIds,
        bytes32[] memory messageHashes
    ) external payable onlyYaho returns (bytes32) {
        for (uint256 i = 0; i < messageIds.length; ) {
            emit MessageDispatched(targetChainId, adapter, messageIds[i], messageHashes[i]);
            unchecked {
                ++i;
            }
        }
        return _dispatch(targetChainId, address(adapter), messageIds, messageHashes);
    }

    function _dispatch(
        uint256 targetChainId,
        address adapter,
        uint256[] memory ids,
        bytes32[] memory hashes
    ) internal virtual returns (bytes32);
}
