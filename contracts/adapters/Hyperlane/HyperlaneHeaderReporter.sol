// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMailbox } from "./IHyperlane.sol";
import "../HeaderStorage.sol";

contract HyperlaneHeaderReporter {
    IMailbox public immutable mailbox;
    uint32 public immutable destinationDomain;
    address public immutable target;
    address public oracleAdapter;
    HeaderStorage public immutable headerStorage;

    constructor(IMailbox _mailbox, HeaderStorage _headerStorage, uint32 _destinationDomain, address _target) {
        mailbox = _mailbox;
        headerStorage = _headerStorage;
        destinationDomain = _destinationDomain;
        target = _target;
    }

    /// @dev Reports the given block header to the oracleAdapter via Hyperlane.
    /// @param blockNumber Uint256 block number to pass over Hyperlane.
    /// @param msgId message ID
    function reportHeader(uint256 blockNumber) public returns (bytes32 msgId) {
        bytes32 blockHeader = headerStorage.storeBlockHeader(blockNumber);
        bytes memory callData = abi.encode(blockNumber, blockHeader);
        msgId = mailbox.dispatch(destinationDomain, addressToBytes32(target), callData);
    }

    function addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }
}
