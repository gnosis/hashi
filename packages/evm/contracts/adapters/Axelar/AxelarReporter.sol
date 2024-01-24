// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { IAxelarGateway } from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol";
import { IAxelarGasService } from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";
import { Reporter } from "../Reporter.sol";

contract AxelarReporter is Reporter, Ownable {
    using Strings for uint256;

    string public constant PROVIDER = "axelar";
    bytes32 private constant NULL_STRING = keccak256("");
    IAxelarGateway public immutable AXELAR_GATEWAY;
    IAxelarGasService public immutable AXELAR_GAS_SERVICE;

    mapping(uint256 => string) public chainIdNames;

    error ChainIdNotSupported(uint256 chainId);

    event ChainNameSet(uint256 indexed chainId, string indexed chainName);

    constructor(
        address headerStorage,
        address yaho,
        address axelarGateway,
        address axelarGasService
    ) Reporter(headerStorage, yaho) {
        AXELAR_GATEWAY = IAxelarGateway(axelarGateway);
        AXELAR_GAS_SERVICE = IAxelarGasService(axelarGasService);
    }

    function setChainNameByChainId(uint256 chainId, string calldata chainName) external onlyOwner {
        chainIdNames[chainId] = chainName;
        emit ChainNameSet(chainId, chainName);
    }

    function _dispatch(
        uint256 toChainId,
        address adapter,
        uint256[] memory ids,
        bytes32[] memory hashes
    ) internal override returns (bytes32) {
        string memory chainName = chainIdNames[toChainId];
        if (keccak256(abi.encode(chainName)) == NULL_STRING) revert ChainIdNotSupported(toChainId);

        string memory sAdapter = uint256(uint160(adapter)).toHexString(20);
        bytes memory payload = abi.encode(ids, hashes);

        if (msg.value > 0) {
            AXELAR_GAS_SERVICE.payNativeGasForContractCall{ value: msg.value }(
                address(this),
                chainName,
                sAdapter,
                payload,
                msg.sender
            );
        }

        AXELAR_GATEWAY.callContract(chainName, sAdapter, payload);
        return bytes32(0);
    }
}
