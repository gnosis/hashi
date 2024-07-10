// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IXReceiver } from "@connext/interfaces/core/IXReceiver.sol";
import { BlockHashAdapter } from "../BlockHashAdapter.sol";

contract ConnextAdapter is BlockHashAdapter, Ownable, IXReceiver {
    string public constant PROVIDER = "connext";
    address public immutable CONNEXT;

    mapping(uint32 => address) public enabledReporters;
    mapping(uint32 => uint256) public chainIds;

    error UnauthorizedConnextReceive();

    event ReporterSet(uint256 indexed chainId, uint32 indexed domainId, address indexed reporter);

    constructor(address connext) {
        CONNEXT = connext;
    }

    function setReporterByChain(uint256 chainId, uint32 domainId, address reporter) external onlyOwner {
        enabledReporters[domainId] = reporter;
        chainIds[domainId] = chainId;
        emit ReporterSet(chainId, domainId, reporter);
    }

    function xReceive(
        bytes32 /* transferId_ */,
        uint256 /* amount_ */,
        address /* asset_ */,
        address originSender,
        uint32 origin,
        bytes memory callData
    ) external returns (bytes memory) {
        if (msg.sender != CONNEXT || enabledReporters[origin] != originSender) revert UnauthorizedConnextReceive();
        uint256 sourceChainId = chainIds[origin];
        (uint256[] memory ids, bytes32[] memory hashes) = abi.decode(callData, (uint256[], bytes32[]));
        _storeHashes(sourceChainId, ids, hashes);
        return "";
    }
}
