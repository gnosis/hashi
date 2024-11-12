// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

interface IReceiverGateway {
    function veaOutbox() external view returns (address);
    function senderGateway() external view returns (address);
}
