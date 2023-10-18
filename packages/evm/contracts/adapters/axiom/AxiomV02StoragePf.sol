// SPDX-License-Identifier: MIT
// WARNING! This smart contract and the associated zk-SNARK verifiers have not been audited.
// DO NOT USE THIS CONTRACT FOR PRODUCTION
pragma solidity ^0.8.12;

import { IAxiomV0 } from "./IAxiomV0.sol";
import { IAxiomV0StoragePf } from "./IAxiomV0StoragePf.sol";
// import {Ownable} from "openzeppelin-contracts/access/Ownable.sol";
import { Ownable } from "./Ownable.sol";
import { IHashi } from "../../interfaces/IHashi.sol";
import { IOracleAdapter } from "../../interfaces/IOracleAdapter.sol";

uint8 constant SLOT_NUMBER = 10;

contract AxiomV02StoragePf is Ownable, IAxiomV0StoragePf {
    string public constant VERSION = "0.2";

    address private axiomAddress; // address of deployed AxiomV0 contract
    address private verifierAddress; // address of deployed ZKP verifier for storage proofs
    address private hashiAddress; // address of deployed Hashi contract

    address private cryptoPunk420OwnerAtBlock10Mil; // address of attested owner of CryptoPunk#420 at Block 10000000

    // slotAttestations[keccak256(blockNumber || addr || slot || slotValue)] = true
    // if and only if it has been checked that:
    //    at block number `blockNumber`, the account storage of `addr` has value `slotValue` at slot `slot`
    mapping(bytes32 => bool) public slotAttestations;

    event UpdateAxiomAddress(address newAddress);
    event UpdateSnarkVerifierAddress(address newAddress);

    constructor(address _axiomAddress, address _verifierAddress, address _hashiAddress) {
        axiomAddress = _axiomAddress;
        verifierAddress = _verifierAddress;
        hashiAddress = _hashiAddress;
    }

    function updateAxiomAddress(address _axiomAddress) external onlyOwner {
        axiomAddress = _axiomAddress;
        emit UpdateAxiomAddress(_axiomAddress);
    }

    function updateSnarkVerifierAddress(address _verifierAddress) external onlyOwner {
        verifierAddress = _verifierAddress;
        emit UpdateSnarkVerifierAddress(_verifierAddress);
    }

    function isSlotAttestationValid(
        uint32 blockNumber,
        address addr,
        uint256 slot,
        uint256 slotValue
    ) external view returns (bool) {
        return slotAttestations[keccak256(abi.encodePacked(blockNumber, addr, slot, slotValue))];
    }

    // Verify a storage proof for 10 storage slots in a single account at a single block
    function attestSlots(IAxiomV0.BlockHashWitness calldata blockData, bytes calldata proof) external {
        if (block.number - blockData.blockNumber <= 256) {
            require(
                IAxiomV0(axiomAddress).isRecentBlockHashValid(blockData.blockNumber, blockData.claimedBlockHash),
                "Block hash was not validated in cache"
            );
        } else {
            require(IAxiomV0(axiomAddress).isBlockHashValid(blockData), "Block hash was not validated in cache");
        }

        // Extract instances from proof
        uint256 _blockHash = (uint256(bytes32(proof[384:384 + 32])) << 128) |
            uint128(bytes16(proof[384 + 48:384 + 64]));
        uint256 _blockNumber = uint256(bytes32(proof[384 + 64:384 + 96]));
        address account = address(bytes20(proof[384 + 108:384 + 128]));

        // Check block hash and block number
        require(_blockHash == uint256(blockData.claimedBlockHash), "Invalid block hash in instance");
        require(_blockNumber == blockData.blockNumber, "Invalid block number in instance");

        (bool success, ) = verifierAddress.call(proof);
        if (!success) {
            revert("Proof verification failed");
        }

        for (uint16 i = 0; i < SLOT_NUMBER; i++) {
            uint256 slot = (uint256(bytes32(proof[384 + 128 + 128 * i:384 + 160 + 128 * i])) << 128) |
                uint128(bytes16(proof[384 + 176 + 128 * i:384 + 192 + 128 * i]));
            uint256 slotValue = (uint256(bytes32(proof[384 + 192 + 128 * i:384 + 224 + 128 * i])) << 128) |
                uint128(bytes16(proof[384 + 240 + 128 * i:384 + 256 + 128 * i]));
            slotAttestations[keccak256(abi.encodePacked(blockData.blockNumber, account, slot, slotValue))] = true;
            emit SlotAttestationEvent(blockData.blockNumber, account, slot, slotValue);
        }
    }

    // Verify a storage proof for 10 storage slots in a single account at a single block
    function attestSlotsWithHashi(
        bytes calldata proof,
        uint256 domain,
        uint32 blockNumber,
        bytes32 blockHash,
        IOracleAdapter[] memory oracleAdapters
    ) external {
        bytes32 hashFromHashi = IHashi(hashiAddress).getHash(domain, blockNumber, oracleAdapters);
        require(hashFromHashi == blockHash, "block hash mismatch with hash block hash");

        // Extract instances from proof
        uint256 _blockHash = (uint256(bytes32(proof[384:384 + 32])) << 128) |
            uint128(bytes16(proof[384 + 48:384 + 64]));
        uint256 _blockNumber = uint256(bytes32(proof[384 + 64:384 + 96]));
        address account = address(bytes20(proof[384 + 108:384 + 128]));

        // Check block hash and block number
        require(_blockHash == uint256(blockHash), "Invalid block hash in instance");
        require(_blockNumber == blockNumber, "Invalid block number in instance");

        (bool success, ) = verifierAddress.call(proof);
        if (!success) {
            revert("Proof verification failed");
        }

        for (uint16 i = 0; i < SLOT_NUMBER; i++) {
            uint256 slot = (uint256(bytes32(proof[384 + 128 + 128 * i:384 + 160 + 128 * i])) << 128) |
                uint128(bytes16(proof[384 + 176 + 128 * i:384 + 192 + 128 * i]));
            uint256 slotValue = (uint256(bytes32(proof[384 + 192 + 128 * i:384 + 224 + 128 * i])) << 128) |
                uint128(bytes16(proof[384 + 240 + 128 * i:384 + 256 + 128 * i]));
            bytes32 hashedVal = keccak256(abi.encodePacked(blockNumber, account, slot, slotValue));
            slotAttestations[hashedVal] = true;
            emit SlotAttestationEvent(blockNumber, account, slot, slotValue);
        }
    }

    // Verify a storage proof for 10 storage slots in a single account at a single block
    function attestCryptoPunk420AddressWithHashi(
        bytes calldata proof,
        uint256 domain,
        uint32 blockNumber,
        bytes32 blockHash,
        IOracleAdapter[] memory oracleAdapters
    ) external returns (address) {
        bytes32 hashFromHashi = IHashi(hashiAddress).getHash(domain, blockNumber, oracleAdapters);
        require(hashFromHashi == blockHash, "block hash mismatch with hash block hash");

        // Extract instances from proof
        uint256 _blockHash = (uint256(bytes32(proof[384:384 + 32])) << 128) |
            uint128(bytes16(proof[384 + 48:384 + 64]));
        uint256 _blockNumber = uint256(bytes32(proof[384 + 64:384 + 96]));
        address account = address(bytes20(proof[384 + 108:384 + 128]));

        // Check block hash and block number
        require(_blockHash == uint256(blockHash), "Invalid block hash in instance");
        require(_blockNumber == blockNumber, "Invalid block number in instance");

        (bool success, ) = verifierAddress.call(proof);
        if (!success) {
            revert("Proof verification failed");
        }

        uint256 slot = (uint256(bytes32(proof[384 + 128:384 + 160])) << 128) |
            uint128(bytes16(proof[384 + 176:384 + 192]));
        uint256 slotValue = (uint256(bytes32(proof[384 + 192:384 + 224])) << 128) |
            uint128(bytes16(proof[384 + 240:384 + 256]));
        bytes32 hashedVal = keccak256(abi.encodePacked(blockNumber, account, slot, slotValue));
        slotAttestations[hashedVal] = true;
        cryptoPunk420OwnerAtBlock10Mil = address(uint160(slotValue));
        // CryptoPunk#420 address at the slot for the given block
        return cryptoPunk420OwnerAtBlock10Mil;
    }

    // Return the stored CryptoPunk#420 owner at block 10,000,000 on Ethereum
    function getCryptoPunk420OwnerAtBlock10Mil() external view returns (address) {
        return cryptoPunk420OwnerAtBlock10Mil;
    }
}
