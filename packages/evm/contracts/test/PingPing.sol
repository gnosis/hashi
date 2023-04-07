// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

contract PingPong {
    event Pong(string pong);

    function ping() public returns (string memory pong) {
        pong = "pong";
        emit Pong(pong);
    }
}
