// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import "../BlockHashOracleAdapter.sol";

contract SygmaAdapter is AccessControl, BlockHashOracleAdapter {
    string public constant PROVIDER = "sygma";

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

    constructor(address handler) {
        _handler = handler;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier onlyAdmin() {
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) revert Unauthorized();
        _;
    }

    function setReporter(address reporterAddress, uint128 chainID, bool enabled) public onlyAdmin {
        reporters[reporterAddress] = Reporter(chainID, enabled);
        emit ReporterSet(reporterAddress, chainID, enabled);
    }

    function storeHashes(address reporterAddress, uint256[] calldata ids, bytes32[] calldata hashes) public {
        if (ids.length != hashes.length) revert ArrayLengthMismatch();
        if (msg.sender != _handler) revert InvalidHandler(msg.sender);
        Reporter memory reporter = reporters[reporterAddress];
        if (!reporter.enabled) revert InvalidReporter(reporterAddress);
        uint256 chainID = uint256(reporter.chainID);
        _storeHashes(chainID, ids, hashes);
    }
}
