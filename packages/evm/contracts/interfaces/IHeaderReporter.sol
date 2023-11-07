// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

interface IHeaderReporter {
    event HeaderReported(uint256 indexed toChainId, uint256 indexed blockNumber, bytes32 indexed blockHeader);

    function reportHeaders(
        uint256[] calldata blockNumbers,
        uint256[] calldata toChainIds,
        address[] calldata adapters,
        address[] calldata destinationAdapters,
        address yaho
    ) external;
}
