// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IRouterClient } from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import { Client } from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import { Reporter } from "../Reporter.sol";

contract CCIPReporter is Reporter, Ownable {
    string public constant PROVIDER = "ccip";

    IRouterClient public immutable CCIP_ROUTER;

    uint256 public fee;
    mapping(uint256 => uint64) public chainSelectors;

    error ChainSelectorNotAvailable();

    event ChainSelectorSet(uint256 indexed chainId, uint64 indexed chainSelector);
    event FeeSet(uint256 fee);

    constructor(address headerStorage, address yaho, address ccipRouter) Reporter(headerStorage, yaho) {
        CCIP_ROUTER = IRouterClient(ccipRouter);
    }

    function setChainSelectorByChainId(uint256 chainId, uint64 chainSelector) external onlyOwner {
        chainSelectors[chainId] = chainSelector;
        emit ChainSelectorSet(chainId, chainSelector);
    }

    function setFee(uint256 fee_) external onlyOwner {
        fee = fee_;
        emit FeeSet(fee_);
    }

    function _dispatch(
        uint256 targetChainId,
        address adapter,
        uint256[] memory ids,
        bytes32[] memory hashes
    ) internal override returns (bytes32) {
        uint64 targetChainSelector = chainSelectors[targetChainId];
        if (targetChainSelector == 0) revert ChainSelectorNotAvailable();
        bytes memory payload = abi.encode(ids, hashes);
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(adapter),
            data: payload,
            tokenAmounts: new Client.EVMTokenAmount[](0), // Empty array - no tokens are transferred
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({ gasLimit: 200_000, strict: false })),
            feeToken: address(0) // Pay fees with native
        });
        CCIP_ROUTER.ccipSend{ value: fee }(targetChainSelector, message);
        return bytes32(0);
    }
}
