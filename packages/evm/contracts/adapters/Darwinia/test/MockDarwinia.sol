// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "../interfaces/IDarwinia.sol";

contract MockLightClient is ILightClient {
    function headerOf(uint256 blockNumber) external view returns(bytes32) {
        this;
        if (blockNumber == 0) {
            return 0x0000000000000000000000000000000000000000000000000000000000000000;
        } else {
            return 0x0000000000000000000000000000000000000000000000000000000000000001;
        }
    }
}

contract MockDarwiniaRouter is IDarwiniaRouter {
    ILightClient lc;
    constructor() {
        lc = new MockLightClient();
    }

    function lightClientOf(uint256) external view returns(ILightClient) {
        return ILightClient(lc);
    }
}
