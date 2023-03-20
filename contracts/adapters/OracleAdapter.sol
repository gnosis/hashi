// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "solidity-rlp/contracts/RLPReader.sol";

import "./interfaces/IOracleAdapter.sol";

abstract contract OracleAdapter is IOracleAdapter {
    mapping(uint256 => mapping(uint256 => bytes32)) public hashes;

    using RLPReader for RLPReader.RLPItem;

    /// @dev Returns the hash for a given ID, as reported by the oracle.
    /// @param domain Identifier for the domain to query.
    /// @param id Identifier for the ID to query.
    /// @return hash Bytes32 hash reported by the oracle for the given ID on the given domain.
    /// @notice MUST return bytes32(0) if the oracle has not yet reported a hash for the given ID.
    function getHashFromOracle(uint256 domain, uint256 id) external view returns (bytes32 hash) {
        hash = hashes[domain][id];
    }

    function proveAncestralBlockHashes(uint256 chainId, bytes[] memory blockHeaders) external {
        for (uint256 i = 0; i < blockHeaders.length; i++) {
            RLPReader.RLPItem memory blockHeaderRLP = RLPReader.toRlpItem(blockHeaders[i]);

            if (!blockHeaderRLP.isList()) revert InvalidBlockHeaderRLP();

            RLPReader.RLPItem[] memory blockHeaderContent = blockHeaderRLP.toList();

            // A block header should have between 15 and 17 elements (baseFee and withdrawalsRoot have been added later)
            if (blockHeaderContent.length < 15 || blockHeaderContent.length > 17)
                revert InvalidBlockHeaderLength(blockHeaderContent.length);

            bytes32 blockParent = bytes32(blockHeaderContent[0].toUint());
            uint256 blockNumber = uint256(blockHeaderContent[8].toUint());

            bytes32 reportedBlockHash = keccak256(blockHeaders[i]);
            bytes32 storedBlockHash = hashes[chainId][blockNumber];

            if (reportedBlockHash != storedBlockHash)
                revert ConflictingBlockHeader(blockNumber, reportedBlockHash, storedBlockHash);

            _storeHash(chainId, blockNumber - 1, blockParent);
        }
    }

    function _storeHash(uint256 domain, uint256 id, bytes32 hash) internal {
        bytes32 currentHash = hashes[domain][id];
        if (currentHash != hash) {
            hashes[domain][id] = hash;
            emit HashStored(id, hash);
        }
    }
}
