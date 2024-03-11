// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { Reporter } from "../Reporter.sol";
import { IGateway } from "@routerprotocol/evm-gateway-contracts/contracts/IGateway.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

interface IRouterGateway is IGateway {
    function iSendDefaultFee() external view returns (uint256);

    function currentVersion() external view returns (uint256);
}

interface IRouterGasStation {
    function payFee(string memory destChainId, uint256 destGasLimit) external payable returns (uint256);
}

contract RouterReporter is Reporter, Ownable {
    using Strings for uint256;

    string public constant PROVIDER = "router";
    bytes32 private constant NULL_STRING = keccak256("");
    IRouterGateway public immutable ROUTER_GATEWAY;
    IRouterGasStation public immutable ROUTER_GAS_STATION;
    uint256 public immutable CURRENT_GATEWAY_VERSION;
    string public feePayer;

    mapping(uint256 => string) public chainIds;

    error ChainIdNotSupported(uint256 chainId);
    error InsufficientFeePassed();

    event ChainIdSet(uint256 indexed chainId, string indexed chainIdString);
    event FeePayerSet(string oldFeePayer, string feePayer);

    constructor(
        address headerStorage,
        address yaho,
        address routerGateway,
        address routerGasStation,
        string memory routerFeePayer
    ) Reporter(headerStorage, yaho) {
        ROUTER_GATEWAY = IRouterGateway(routerGateway);
        ROUTER_GAS_STATION = IRouterGasStation(routerGasStation);

        feePayer = routerFeePayer;

        CURRENT_GATEWAY_VERSION = ROUTER_GATEWAY.currentVersion();
        ROUTER_GATEWAY.setDappMetadata(routerFeePayer);
    }

    function setRouterFeePayer(string memory routerFeePayer) external onlyOwner {
        string memory oldFeePayer = feePayer;
        feePayer = routerFeePayer;
        ROUTER_GATEWAY.setDappMetadata(routerFeePayer);

        emit FeePayerSet(oldFeePayer, routerFeePayer);
    }

    function setChainIdStringByChainId(uint256 chainId, string calldata chainIdString) external onlyOwner {
        chainIds[chainId] = chainIdString;
        emit ChainIdSet(chainId, chainIdString);
    }

    function getRequestMetadata() internal pure returns (bytes memory) {
        bytes memory requestMetadata = abi.encodePacked(
            uint64(200_000),
            uint64(0),
            uint64(0),
            uint64(0),
            uint128(0),
            uint8(0),
            false,
            string("")
        );
        return requestMetadata;
    }

    function _dispatch(
        uint256 targetChainId,
        address adapter,
        uint256[] memory ids,
        bytes32[] memory hashes
    ) internal override returns (bytes32) {
        string memory targetChainIdStr = chainIds[targetChainId];
        if (keccak256(abi.encode(targetChainIdStr)) == NULL_STRING) revert ChainIdNotSupported(targetChainId);

        bytes memory payload = abi.encode(ids, hashes);
        string memory stringAdapter = uint256(uint160(adapter)).toHexString(20);
        bytes memory requestPacket = abi.encode(stringAdapter, payload);
        bytes memory requestMetadata = getRequestMetadata();

        uint256 iSendFee = ROUTER_GATEWAY.iSendDefaultFee();
        if (msg.value < iSendFee) revert InsufficientFeePassed();

        ROUTER_GAS_STATION.payFee{ value: msg.value }(targetChainIdStr, 200_000);

        ROUTER_GATEWAY.iSend{ value: iSendFee }(
            CURRENT_GATEWAY_VERSION,
            0,
            string(""),
            targetChainIdStr,
            requestMetadata,
            requestPacket
        );

        return bytes32(0);
    }
}
