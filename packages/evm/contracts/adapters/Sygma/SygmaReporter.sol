// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Reporter } from "../Reporter.sol";
import { ISygmaAdapter } from "./interfaces/ISygmaAdapter.sol";
import { IBridge } from "./interfaces/IBridge.sol";

contract SygmaReporter is Reporter, Ownable {
    string public constant PROVIDER = "sygma";

    IBridge public immutable BRIDGE;

    mapping(uint256 => uint8) public domainIds;
    mapping(uint256 => bytes32) public resourceIds;

    error DomainIdNotAvailable();
    error ResourceIdNotAvailable();

    event DomainIdSet(uint256 indexed chainId, uint8 indexed domainId);
    event ResourceIdSet(uint256 indexed chainId, bytes32 indexed resourceId);

    constructor(address headerStorage, address yaho, address bridge) Reporter(headerStorage, yaho) {
        BRIDGE = IBridge(bridge);
    }

    function setDomainIdAndResourceIdByChainId(uint256 chainId, uint8 domainId, bytes32 resourceId) external onlyOwner {
        domainIds[chainId] = domainId;
        resourceIds[chainId] = resourceId;
        emit DomainIdSet(chainId, domainId);
        emit ResourceIdSet(chainId, resourceId);
    }

    function _dispatch(
        uint256 toChainId,
        address adapter,
        uint256[] memory ids,
        bytes32[] memory hashes
    ) internal override returns (bytes32) {
        uint8 domainId = domainIds[toChainId];
        if (domainId == 0) revert DomainIdNotAvailable();
        bytes32 resourceId = resourceIds[toChainId];
        if (resourceId == bytes32(0)) revert ResourceIdNotAvailable();
        bytes memory depositData = abi.encodePacked(
            // uint256 maxFee
            uint256(950000),
            // uint16 len(executeFuncSignature)
            uint16(4),
            // bytes executeFuncSignature
            ISygmaAdapter(address(0)).storeHashes.selector,
            // uint8 len(executeContractAddress)
            uint8(20),
            // bytes executeContractAddress
            adapter,
            // uint8 len(executionDataDepositor)
            uint8(20),
            // bytes executionDataDepositor
            address(this),
            // bytes executionDataDepositor + executionData
            prepareDepositData(ids, hashes)
        );
        (uint64 nonce, bytes memory handlerResponse) = BRIDGE.deposit{ value: msg.value }(
            domainId,
            resourceId,
            depositData,
            "" // feeData
        );
        return bytes32(keccak256(abi.encode(nonce, handlerResponse)));
    }

    function slice(bytes calldata input, uint256 position) public pure returns (bytes memory) {
        return input[position:];
    }

    function prepareDepositData(
        uint256[] memory messageIds,
        bytes32[] memory hashes
    ) public view returns (bytes memory) {
        bytes memory encoded = abi.encode(address(0), messageIds, hashes);
        return this.slice(encoded, 32);
    }
}
