// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

contract PingPong {
    function ping() public pure returns (string memory pong) {
        pong = "pong";
    }
}
