// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../OracleAdapter.sol";
import "../BlockHashOracleAdapter.sol";

contract SygmaAdapter is AccessControl, OracleAdapter, BlockHashOracleAdapter {
    struct Reporter {
        uint128 chainID;
        bool enabled;
    }

    address public immutable _handler;
    mapping(address => Reporter) public reporters;

    error ArrayLengthMismatch();
    error Unauthorized();
    error InvalidHandler(address handler);
    error InvalidReporter(address reporter);

    event ReporterSet(address reporterAddress, uint256 chainID, bool enabled);

    /**
        @param handler Contract address of the generic handler.
    */
    constructor(address handler) {
        _handler = handler;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier onlyAdmin() {
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) revert Unauthorized();
        _;
    }

    /**
        @dev Sets parameters of a source chain hash reporter.
        @param reporterAddress Hash reporter address on the source chain.
        @param chainID ChainID of the source chain.
        @param enabled Status of the reporter.
    */
    function setReporter(address reporterAddress, uint128 chainID, bool enabled) public onlyAdmin {
        reporters[reporterAddress] = Reporter(chainID, enabled);
        emit ReporterSet(reporterAddress, chainID, enabled);
    }

    /**
        @dev Stores the hashes for a given array of ids.
        @param reporterAddress Hash reporter address on the source chain.
        @param ids Array of block numbers for which to set the hashes.
        @param hashes Array of hashes to set for the given block numbers.
        @notice Only callable by `_handler` with a message passed from an authorized reporter.
        @notice Will revert if array lengths do not match.
    */
    function storeHashes(address reporterAddress, uint256[] calldata ids, bytes32[] calldata hashes) public {
        if (ids.length != hashes.length) revert ArrayLengthMismatch();
        if (msg.sender != _handler) revert InvalidHandler(msg.sender);

        Reporter memory reporter = reporters[reporterAddress];
        if (!reporter.enabled) revert InvalidReporter(reporterAddress);
        uint256 chainID = uint256(reporter.chainID);

        for (uint i = 0; i < ids.length; i++) {
            _storeHash(chainID, ids[i], hashes[i]);
        }
    }
}
