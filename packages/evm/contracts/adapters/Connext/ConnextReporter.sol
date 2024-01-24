// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IConnext } from "@connext/interfaces/core/IConnext.sol";
import { Reporter } from "../Reporter.sol";

contract ConnextReporter is Reporter, Ownable {
    string public constant PROVIDER = "connext";
    IConnext public immutable CONNEXT;

    mapping(uint256 => uint32) public domainIds;
    event ConnextTransfer(bytes32 transferId);

    error DomainIdNotAvailable();

    event DomainIdSet(uint256 indexed chainId, uint32 indexed domainId);

    constructor(address headerStorage, address yaho, address connext) Reporter(headerStorage, yaho) {
        CONNEXT = IConnext(connext);
    }

    function setDomainIdByChainId(uint256 chainId, uint32 domainId) external onlyOwner {
        domainIds[chainId] = domainId;
        emit DomainIdSet(chainId, domainId);
    }

    function _dispatch(
        uint256 toChainId,
        address adapter,
        uint256[] memory ids,
        bytes32[] memory hashes
    ) internal override returns (bytes32) {
        uint32 domainId = domainIds[toChainId];
        if (domainId == 0) revert DomainIdNotAvailable();
        bytes memory payload = abi.encode(ids, hashes);
        bytes32 transferId = CONNEXT.xcall{ value: msg.value }(
            domainId, // _destination: Domain ID of the destination chain
            adapter, // _to: address of the target contract
            address(0), // _asset: use address zero for 0-value transfers
            msg.sender, // _delegate: address that can revert or forceLocal on destination
            0, // _amount: 0 because no funds are being transferred
            0, // _slippage: can be anything between 0-10000 because no funds are being transferred
            payload // _callData: the encoded calldata to send
        );
        emit ConnextTransfer(transferId);

        return bytes32(0);
    }
}
