// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ZetaReceiver, ZetaInterfaces } from "./interfaces/ZetaInterfaces.sol";
import { BlockHashOracleAdapter } from "../BlockHashOracleAdapter.sol";

contract ZetaAdapter is BlockHashOracleAdapter, Ownable, ZetaReceiver {
    string public constant PROVIDER = "zeta";
    address public immutable ZETA_CONNECTOR;

    mapping(uint256 => bytes32) public enabledReporters;

    error UnauthorizedZetaChainReceive();

    event ReporterSet(uint256 indexed chainId, address indexed reporter);

    constructor(address zetaConnector) {
        ZETA_CONNECTOR = zetaConnector;
    }

    function onZetaMessage(ZetaInterfaces.ZetaMessage calldata zetaMessage) external {
        // NOTE: auth adapted from "ZetaInteractor" contract's "isValidMessageCall" modifier
        if (
            msg.sender != ZETA_CONNECTOR ||
            enabledReporters[zetaMessage.sourceChainId] != keccak256(zetaMessage.zetaTxSenderAddress)
        ) revert UnauthorizedZetaChainReceive();
        (uint256[] memory ids, bytes32[] memory hashes) = abi.decode(zetaMessage.message, (uint256[], bytes32[]));
        _storeHashes(zetaMessage.sourceChainId, ids, hashes);
    }

    function setReporterByChainId(uint256 chainId, address reporter) external onlyOwner {
        enabledReporters[chainId] = keccak256(abi.encodePacked(reporter));
        emit ReporterSet(chainId, reporter);
    }
}
