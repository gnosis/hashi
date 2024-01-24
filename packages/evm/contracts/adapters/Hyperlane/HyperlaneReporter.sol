// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IMailbox } from "@hyperlane-xyz/core/contracts/interfaces/IMailbox.sol";
import { TypeCasts } from "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";
import { Reporter } from "../Reporter.sol";

contract HyperlaneReporter is Reporter, Ownable {
    using TypeCasts for address;

    string public constant PROVIDER = "hyperlane";
    IMailbox public immutable HYPERLANE_MAILBOX;

    mapping(uint256 => uint32) public domains;

    error DomainNotAvailable();

    event DomainSet(uint256 indexed chainId, uint32 indexed domain);

    constructor(address headerStorage, address yaho, address hyperlaneMailbox) Reporter(headerStorage, yaho) {
        HYPERLANE_MAILBOX = IMailbox(hyperlaneMailbox);
    }

    function setDomainByChainId(uint256 chainId, uint32 domain) external onlyOwner {
        domains[chainId] = domain;
        emit DomainSet(chainId, domain);
    }

    function _dispatch(
        uint256 toChainId,
        address adapter,
        uint256[] memory ids,
        bytes32[] memory hashes
    ) internal override returns (bytes32) {
        uint32 destinationDomain = domains[toChainId];
        if (destinationDomain == 0) revert DomainNotAvailable();
        bytes memory payload = abi.encode(ids, hashes);
        HYPERLANE_MAILBOX.dispatch{ value: msg.value }(destinationDomain, adapter.addressToBytes32(), payload);

        return bytes32(0);
    }
}
