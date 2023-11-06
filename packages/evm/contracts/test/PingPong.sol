// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { IJushinki } from "../interfaces/IJushinki.sol";

contract PingPong is IJushinki {
    event Pong(string pong);

    uint256 public count;

    function ping() public returns (string memory pong) {
        count++;
        pong = "pong";
        emit Pong(pong);
    }

    function onMessage(bytes calldata, bytes32, uint256, address) external returns (bytes memory) {
        return abi.encode(ping());
    }
}
