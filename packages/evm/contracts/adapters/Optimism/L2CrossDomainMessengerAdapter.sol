// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { ICrossDomainMessenger } from "./interfaces/ICrossDomainMessenger.sol";
import { BlockHashOracleAdapter } from "../BlockHashOracleAdapter.sol";

contract L2CrossDomainMessengerAdapter is BlockHashOracleAdapter {
    string public constant PROVIDER = "amb";

    ICrossDomainMessenger public immutable L2_CROSS_DOMAIN_MESSENGER;
    address public immutable REPORTER;
    uint256 public immutable SOURCE_CHAIN_ID;

    error ArrayLengthMissmatch();
    error UnauthorizedHashReporter(address sender, address expectedSender);
    error UnauthorizedL2CrossDomainMessenger(address domainMessageSender, address expectedDomainMessageSender);

    constructor(ICrossDomainMessenger l2CrossDomainMessenger_, address reporter, uint256 sourceChainId) {
        L2_CROSS_DOMAIN_MESSENGER = ICrossDomainMessenger(l2CrossDomainMessenger_);
        REPORTER = reporter;
        SOURCE_CHAIN_ID = sourceChainId;
    }

    modifier onlyValid() {
        if (msg.sender != address(L2_CROSS_DOMAIN_MESSENGER))
            revert UnauthorizedL2CrossDomainMessenger(msg.sender, address(L2_CROSS_DOMAIN_MESSENGER));
        address xDomainMessageSender = L2_CROSS_DOMAIN_MESSENGER.xDomainMessageSender();
        if (xDomainMessageSender != REPORTER) revert UnauthorizedHashReporter(xDomainMessageSender, REPORTER);
        _;
    }

    function storeHashes(uint256[] memory ids, bytes32[] memory hashes) external onlyValid {
        if (ids.length != hashes.length) revert ArrayLengthMissmatch();
        _storeHashes(SOURCE_CHAIN_ID, ids, hashes);
    }
}
