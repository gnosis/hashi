// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IJushin } from "../interfaces/IJushin.sol";

contract PingPong is IJushin {
    uint256 public count;

    event Pong(uint256 count);

    function ping() external {
        count++;
        emit Pong(count);
    }

    function onMessage(uint256, uint256, address, bytes calldata) external returns (bytes memory) {
        count++;
        emit Pong(count);
        return abi.encode(0);
    }
}
