// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMailbox } from "./IHyperlane.sol";
import "../HeaderStorage.sol";

contract HyperlaneHeaderReporter {
    uint32 public immutable destinationChainId;
    address public immutable target;
    IMailbox public immutable mailbox;
    HeaderStorage public immutable headerStorage;

    constructor(IMailbox _mailbox, HeaderStorage _headerStorage, uint32 _destinationChainId, address _target) {
        mailbox = _mailbox;
        headerStorage = _headerStorage;
        destinationChainId = _destinationChainId;
        target = _target;
    }

    /// @dev Reports the given block header to the oracleAdapter via Hyperlane.
    /// @param blockNumber Uint256 block number to pass over Hyperlane.
    /// @param msgId message ID
    function reportHeader(uint256 blockNumber) public returns (bytes32 msgId) {
        bytes32 blockHeader = headerStorage.storeBlockHeader(blockNumber);
        bytes memory callData = abi.encode(blockNumber, blockHeader);
        msgId = mailbox.dispatch(destinationChainId, addressToBytes32(target), callData);
    }

    function addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }
}
