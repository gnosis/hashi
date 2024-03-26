// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IMessageReceiverApp } from "./interfaces/IMessageReceiverApp.sol";
import { BlockHashAdapter } from "../BlockHashAdapter.sol";

contract CelerAdapter is BlockHashAdapter, Ownable, IMessageReceiverApp {
    string public constant PROVIDER = "celer";
    address public immutable CELER_BUS;

    mapping(uint64 => address) public enabledReporters;

    error UnauthorizedCelerReceive();

    event ReporterSet(uint64 indexed chainId, address indexed reporter);

    constructor(address celerBus) {
        CELER_BUS = celerBus;
    }

    function executeMessage(
        address sender,
        uint64 srcChainId,
        bytes calldata message,
        address /* executor */
    ) external payable returns (ExecutionStatus) {
        address expectedReporter = enabledReporters[srcChainId];
        if (msg.sender != CELER_BUS || sender != expectedReporter) revert UnauthorizedCelerReceive();
        (uint256[] memory ids, bytes32[] memory hashes) = abi.decode(message, (uint256[], bytes32[]));
        _storeHashes(srcChainId, ids, hashes);
        return ExecutionStatus.Success;
    }

    function setReporterByChainId(uint64 chainId, address reporter) external onlyOwner {
        enabledReporters[chainId] = reporter;
        emit ReporterSet(chainId, reporter);
    }
}
