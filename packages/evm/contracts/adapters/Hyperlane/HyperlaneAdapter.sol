// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IMessageRecipient } from "@hyperlane-xyz/core/contracts/interfaces/IMessageRecipient.sol";
import { IInterchainSecurityModule } from "@hyperlane-xyz/core/contracts/interfaces/IInterchainSecurityModule.sol";
import { BlockHashAdapter } from "../BlockHashAdapter.sol";

contract HyperlaneAdapter is BlockHashAdapter, Ownable, IMessageRecipient {
    string public constant PROVIDER = "hyperlane";

    address public immutable HYPERLANE_MAILBOX;

    mapping(uint32 => bytes32) public enabledReporters;
    mapping(uint32 => uint256) public chainIds;

    error UnauthorizedHyperlaneReceive();

    event ReporterSet(uint256 indexed chainId, uint32 indexed domain, bytes32 indexed reporter);

    constructor(address hyperlaneMailbox) {
        HYPERLANE_MAILBOX = hyperlaneMailbox;
    }

    function handle(uint32 origin, bytes32 sender, bytes calldata message) external payable {
        if (msg.sender != HYPERLANE_MAILBOX || enabledReporters[origin] != sender)
            revert UnauthorizedHyperlaneReceive();
        uint256 sourceChainId = chainIds[origin];
        (uint256[] memory ids, bytes32[] memory hashes) = abi.decode(message, (uint256[], bytes32[]));
        _storeHashes(sourceChainId, ids, hashes);
    }

    function setReporterByChain(uint256 chainId, uint32 domain, bytes32 reporter) external onlyOwner {
        enabledReporters[domain] = reporter;
        chainIds[domain] = chainId;
        emit ReporterSet(chainId, domain, reporter);
    }
}
