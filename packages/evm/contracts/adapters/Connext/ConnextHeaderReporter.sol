// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { HeaderStorage } from "../../utils/HeaderStorage.sol";
import { IConnext } from "@connext/interfaces/core/IConnext.sol";

contract ConnextHeaderReporter {
    IConnext public immutable connext;
    uint32 public immutable destinationDomain;
    address public immutable target;
    address public oracleAdapter;
    HeaderStorage public immutable headerStorage;

    constructor(IConnext _connext, HeaderStorage _headerStorage, uint32 _destinationDomain, address _target) {
        connext = _connext;
        headerStorage = _headerStorage;
        destinationDomain = _destinationDomain;
        target = _target;
    }

    /// @dev Reports the given block header to the oracleAdapter via the Wormhole.
    /// @param blockNumber Uint256 block number to pass over the Wormhole.
    /// @param transferId Uint64 value used to retrive transfer from the Connext network.
    function reportHeader(uint256 blockNumber) public returns (bytes32 transferId) {
        bytes32 blockHeader = headerStorage.storeBlockHeader(blockNumber);
        bytes memory callData = abi.encode(blockNumber, blockHeader);
        transferId = connext.xcall{ value: 0 }(
            destinationDomain, // _destination: Domain ID of the destination chain
            target, // _to: address of the target contract
            address(0), // _asset: use address zero for 0-value transfers
            msg.sender, // _delegate: address that can revert or forceLocal on destination
            0, // _amount: 0 because no funds are being transferred
            0, // _slippage: can be anything between 0-10000 because no funds are being transferred
            callData // _callData: the encoded calldata to send
        );
    }
}
