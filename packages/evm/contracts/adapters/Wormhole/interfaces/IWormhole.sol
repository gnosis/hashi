// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

struct Signature {
    bytes32 r;
    bytes32 s;
    uint8 v;
    uint8 guardianIndex;
}

struct VM {
    uint8 version;
    uint32 timestamp;
    uint32 nonce;
    uint16 emitterChainId;
    bytes32 emitterAddress;
    uint64 sequence;
    uint8 consistencyLevel;
    bytes payload;
    uint32 guardianSetIndex;
    Signature[] signatures;
    bytes32 hash;
}

interface IWormhole {
    /// @dev Publish a message to be attested by the Wormhole network.
    function publishMessage(
        uint32 nonce,
        bytes memory payload,
        uint8 consistencyLevel
    ) external payable returns (uint64 sequence);

    /// @dev parseAndVerifyVM serves to parse an encodedVM and wholy validate it for consumption
    function parseAndVerifyVM(
        bytes calldata encodedVM
    ) external view returns (VM memory vm, bool valid, string memory reason);
}
