// SPDX-License-Identifier: MIT
// WARNING! This smart contract and the associated zk-SNARK verifiers have not been audited.
// DO NOT USE THIS CONTRACT FOR PRODUCTION
pragma solidity ^0.8.12;

import "./IAxiomV0.sol";

interface IAxiomV0StoragePf {
    // slotAttestations[keccak256(blockNumber || addr || slot || slotValue)] = true
    // if and only if it has been checked that:
    //    at block number `blockNumber`, the account storage of `addr` has value `slotValue` at slot `slot`
    function slotAttestations(bytes32 hash) external view returns (bool);

    event SlotAttestationEvent(uint32 blockNumber, address addr, uint256 slot, uint256 slotValue);

    function isSlotAttestationValid(
        uint32 blockNumber,
        address addr,
        uint256 slot,
        uint256 slotValue
    ) external view returns (bool);

    // Verify a storage proof for 10 storage slots in a single account at a single block
    function attestSlots(IAxiomV0.BlockHashWitness calldata blockData, bytes calldata proof) external;
}
