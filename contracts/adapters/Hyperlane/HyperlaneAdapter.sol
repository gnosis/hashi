// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IMessageRecipient } from "./IHyperlane.sol";
import "../OracleAdapter.sol";
import "../BlockHashOracleAdapter.sol";

contract HyperlaneAdapter is OracleAdapter, BlockHashOracleAdapter, IMessageRecipient {
    bytes32 public headerReporter;

    error InvalidInputs();
    error InvalidSource(address _originSender, uint32 _origin);

    mapping(uint32 => uint16) public domainToChainId;
    mapping(uint32 => address) public domainToSource;
    mapping(uint32 => address) public domainToMailbox;

    constructor(
        address[] memory _mailboxes,
        uint32[] memory _originDomains,
        uint16[] memory _originChainIds,
        address[] memory _sources,
        bytes32 _headerReporter
    ) {
        headerReporter = _headerReporter;
        if (
            _originDomains.length != _mailboxes.length ||
            _originDomains.length != _originChainIds.length ||
            _originDomains.length != _sources.length
        ) {
            revert InvalidInputs();
        }
        for (uint256 i = 0; i < _originDomains.length; i++) {
            domainToChainId[_originDomains[i]] = _originChainIds[i];
            domainToSource[_originDomains[i]] = _sources[i];
            domainToMailbox[_originDomains[i]] = address(_mailboxes[i]);
        }
    }

    /** @notice A modifier for authenticated calls.
     * This is an important security consideration. If the target contract
     * function should be authenticated, it must check three things:
     *    1) The originating call comes from the expected origin domain.
     *    2) The originating call comes from the expected source contract.
     *    3) The call to this contract comes from the Hyperlane Mailbox.
     */
    modifier onlySource(address _originSender, uint32 _origin) {
        if (domainToSource[_origin] != _originSender || msg.sender != domainToMailbox[_origin]) {
            revert InvalidSource(_originSender, _origin);
        }
        _;
    }

    /// @dev Stores the block header for a given block.
    /// @param _origin ChainId of the origin chain.
    /// @param _sender Address which originated the call on the origin chain.
    /// @param _body decodable calldata passed through the Hyperlane bridge.
    /// @notice Only callable by `Hyperlane` with a message passed from `headerReporter`.
    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _body
    ) external onlySource(bytes32ToAddress(_sender), _origin) {
        (uint256 blockNumber, bytes32 newBlockHeader) = abi.decode(_body, (uint256, bytes32));
        _storeHash(uint256(domainToChainId[_origin]), blockNumber, newBlockHeader);
    }

    function bytes32ToAddress(bytes32 _buf) internal pure returns (address) {
        return address(uint160(uint256(_buf)));
    }
}
