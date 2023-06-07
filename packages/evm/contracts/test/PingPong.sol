// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

contract PingPong {
    event Pong(string pong);

    uint256 public count;

    function ping() public returns (string memory pong) {
        count++;
        pong = "pong";
        emit Pong(pong);
    }
}
