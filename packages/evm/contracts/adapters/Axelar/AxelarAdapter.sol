// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { AxelarExecutable } from "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";
import { HeaderOracleAdapter } from "../HeaderOracleAdapter.sol";

contract AxelarAdapter is HeaderOracleAdapter, AxelarExecutable {
    string public constant PROVIDER = "axelar";
    string public AXELAR_REPORTER_CHAIN; // Immutable
    bytes32 public immutable AXELAR_REPORTER_CHAIN_HASH;
    string public AXELAR_REPORTER_ADDRESS; // Immutable
    bytes32 public immutable AXELAR_REPORTER_ADDRESS_HASH;

    constructor(
        uint256 reporterChain,
        address reporterAddress,
        address axelarGateway,
        string memory axelarReporterChain,
        string memory axelarReporterAddress
    ) HeaderOracleAdapter(reporterChain, reporterAddress) AxelarExecutable(axelarGateway) {
        require(
            bytes(axelarReporterChain).length > 0 && bytes(axelarReporterAddress).length > 0,
            "AA: invalid ctor call"
        );
        AXELAR_REPORTER_CHAIN = axelarReporterChain;
        AXELAR_REPORTER_CHAIN_HASH = keccak256(bytes(axelarReporterChain));
        AXELAR_REPORTER_ADDRESS = axelarReporterAddress;
        AXELAR_REPORTER_ADDRESS_HASH = keccak256(bytes(axelarReporterAddress));
    }

    function _execute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        require(
            keccak256(bytes(sourceChain)) == AXELAR_REPORTER_CHAIN_HASH &&
                keccak256(bytes(sourceAddress)) == AXELAR_REPORTER_ADDRESS_HASH,
            "AA: auth"
        );
        _receivePayload(payload);
    }

    function _executeWithToken(
        string calldata /* sourceChain */,
        string calldata /* sourceAddress */,
        bytes calldata /* payload */,
        string calldata /* tokenSymbol */,
        uint256 /* amount */
    ) internal pure override {
        revert("AA: no execute with token");
    }
}
