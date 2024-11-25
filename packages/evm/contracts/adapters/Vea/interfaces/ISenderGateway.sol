// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { IVeaInbox } from "./IVeaInbox.sol";

interface ISenderGateway {
    function veaInbox() external view returns (IVeaInbox);
    function receiverGateway() external view returns (address);
}
