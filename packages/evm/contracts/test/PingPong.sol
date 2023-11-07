// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IJushinki } from "../interfaces/IJushinki.sol";

contract PingPong is IJushinki {
    uint256 public count;

    event Pong(uint256 count);

    error PongError();

    function ping() public returns (string memory pong) {
        count++;
        pong = "pong";
        emit Pong(count);
    }

    function onMessage(bytes calldata data, bytes32, uint256, address) external returns (bytes memory) {
        if (uint256(bytes32(data)) == 0) revert PongError();
        return abi.encode(ping());
    }
}
