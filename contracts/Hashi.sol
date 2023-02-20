/*
                  ███▄▄▄                               ,▄▄███▄
                  ████▀`                      ,╓▄▄▄████████████▄
                  ███▌             ,╓▄▄▄▄█████████▀▀▀▀▀▀╙└`
                  ███▌       ▀▀▀▀▀▀▀▀▀▀╙└└-  ████L
                  ███▌                      ████`               ╓██▄
                  ███▌    ╓▄    ╓╓╓╓╓╓╓╓╓╓╓████▄╓╓╓╓╓╓╓╓╓╓╓╓╓╓▄███████▄
                  ███▌  ▄█████▄ ▀▀▀▀▀▀▀▀▀▀████▀▀▀▀▀▀██▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
         ███████████████████████_       ▄███▀        ██µ
                 ▐███▌                ,███▀           ▀██µ
                 ████▌               ▄███▌,           ▄████▄
                ▐████▌             ▄██▀████▀▀▀▀▀▀▀▀▀▀█████▀███▄
               ,█████▌          ,▄██▀_ ▓███          ▐███_  ▀████▄▄
               ██████▌,       ▄██▀_    ▓███          ▐███_    ▀███████▄-
              ███▀███▌▀███▄  ╙"        ▓███▄▄▄▄▄▄▄▄▄▄▄███_      `▀███└
             ▄██^ ███▌  ^████▄         ▓███▀▀▀▀▀▀▀▀▀▀▀███_         `
            ▄██_  ███▌    ╙███         ▓██▀          └▀▀_        ▄,
           ██▀    ███▌      ▀└ ▐███▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄████▄µ
          ██^     ███▌         ▐███▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀██████▀
        ╓█▀       ███▌         ▐███⌐      µ          ╓          ▐███
        ▀         ███▌         ▐███⌐      ███▄▄▄▄▄▄▄████▄       ▐███
                  ███▌         ▐███⌐      ████▀▀▀▀▀▀▀████▀      ▐███
                  ███▌         ▐███⌐      ███▌      J███M       ▐███
                  ███▌         ▐███⌐      ███▌      J███M       ▐███
                  ███▌         ▐███⌐      ████▄▄▄▄▄▄████M       ▐███
                  ███▌         ▐███⌐      ███▌      ▐███M       ▐███
                  ███▌         ▐███⌐      ███▌       ▀▀_        ████
                  ███▌         ▐███⌐      ▀▀_             ▀▀▀███████
                  ███^         ▐███_                          ▐██▀▀　
*/

// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "./IOracleAdapter.sol";

contract Hashi {
    error NoOracleAdaptersGiven(address emitter);
    error OracleDidNotReport(address emitter, IOracleAdapter oracleAdapter);
    error OraclesDisagree(address emitter, IOracleAdapter oracleOne, IOracleAdapter oracleTwo);
    error HighestCountDidNotReport(address emitter);
    error ThresholdNotMet(address, uint256 highestCount, bytes32 blockHeader);

    /// @dev Returns the block header reported by a given oracle for a given block.
    /// @param oracleAdapter Address of the oracle adapter to query.
    /// @param chainId Id of the chain to query.
    /// @param blockNumber Block number for which to return a header.
    /// @return blockHeader Block header reported by the given oracle adapter for the given block number.
    function getHeaderFromOracle(
        IOracleAdapter oracleAdapter,
        uint256 chainId,
        uint256 blockNumber
    ) public view returns (bytes32 blockHeader) {
        blockHeader = oracleAdapter.getHeaderFromOracle(chainId, blockNumber);
    }

    /// @dev Returns the block headers for a given block reported by a given set of oracles.
    /// @param oracleAdapters Array of address for the oracle adapters to query, MUST be provided in numerical order from smallest to largest.
    /// @param chainId Id of the chain to query.
    /// @param blockNumber Block number for which to return headers.
    /// @return blockHeaders Array of block header reported by the given oracle adapters for the given block number.
    /// @notice This method MUST revert if the oracleAdapters array contains duplicates.
    function getHeadersFromOracles(
        IOracleAdapter[] memory oracleAdapters,
        uint256 chainId,
        uint256 blockNumber
    ) public view returns (bytes32[] memory) {
        if (oracleAdapters.length == 0) revert NoOracleAdaptersGiven(address(this));
        bytes32[] memory blockHeaders = new bytes32[](oracleAdapters.length);
        for (uint256 i = 0; i < oracleAdapters.length; i++) {
            blockHeaders[i] = getHeaderFromOracle(oracleAdapters[i], chainId, blockNumber);
        }
        return blockHeaders;
    }

    /// @dev Returns the block header unanimously agreed upon by a given set of oracles.
    /// @param oracleAdapters Array of address for the oracle adapters to query.
    /// @param chainId Id of the chain to query.
    /// @param blockNumber Block number for which to return headers.
    /// @return blockHeader Block header agreed on by the given set of oracle adapters.
    /// @notice MUST revert if oracles disagree on the header or if an oracle does not report.
    function getUnanimousHeader(
        IOracleAdapter[] memory oracleAdapters,
        uint256 chainId,
        uint256 blockNumber
    ) public view returns (bytes32 blockHeader) {
        bytes32[] memory blockHeaders = getHeadersFromOracles(oracleAdapters, chainId, blockNumber);
        bytes32 previousHeader = blockHeaders[0];
        if (previousHeader == bytes32(0)) revert OracleDidNotReport(address(this), oracleAdapters[0]);
        bytes32 currentHeader;
        for (uint256 i = 1; i < blockHeaders.length; i++) {
            currentHeader = blockHeaders[i];
            if (currentHeader == bytes32(0)) revert OracleDidNotReport(address(this), oracleAdapters[i]);
            if (currentHeader != previousHeader)
                revert OraclesDisagree(address(this), oracleAdapters[i - 1], oracleAdapters[i]);
            previousHeader = currentHeader;
        }
        blockHeader = currentHeader;
    }

    /// @dev Returns the blockheader agreed upon by a threshold of given header oracles.
    /// @param oracleAdapters Array of address for the oracle adapters to query.
    /// @param chainId Id of the chain to query.
    /// @param blockNumber Block number for which to return headers.
    /// @param threshold Threshold of oracles that must report the same header for the given block.
    /// @return blockHeader Block header reported by the required threshold of given oracle adapters for the given block number.
    function getHeaderFromThreshold(
        IOracleAdapter[] memory oracleAdapters,
        uint256 chainId,
        uint256 blockNumber,
        uint256 threshold
    ) public view returns (bytes32 blockHeader) {
        bytes32[] memory blockHeaders = getHeadersFromOracles(oracleAdapters, chainId, blockNumber);
        /// sort block headers
        for (uint256 i = 1; i < blockHeaders.length; i++) {
            bytes32 key = blockHeaders[i];
            uint256 j = i - 1;
            bytes32 comp = blockHeaders[j];
            while (comp > key && j > blockHeaders.length) {
                blockHeaders[j + 1] = comp;
                j--;
            }
            blockHeaders[j + 1] = key;
        }

        /// count count how many different results are reported
        uint256 numberOfResults = 1;
        for (uint i = 1; i < blockHeaders.length; i++) {
            if (blockHeaders[i - 1] != blockHeaders[i]) {
                numberOfResults++;
            }
        }
        /// return first block header if unanimous
        if (numberOfResults == 1) {
            return blockHeader[0];
        }

        /// index and count results
        bytes32[] memory indexedHeaders = new bytes32[](numberOfResults);
        uint256[] memory indexedCounts = new uint256[](numberOfResults);
        indexedCounts[0] = 1;
        indexedHeaders[0] = blockHeaders[0];
        uint256 currentCountIndex = 0;
        for (uint i = 1; i < blockHeaders.length; i++) {
            bytes32 currentBlockHeader;
            if (currentBlockHeader != indexedHeaders[currentCountIndex]) {
                currentCountIndex++;
                indexedHeaders[currentCountIndex] = currentBlockHeader;
            }
            indexedCounts[currentCountIndex]++;
        }

        /// pick highest count
        blockHeader = blockHeaders[0];
        currentCountIndex = 0;
        for (uint i = 1; i < indexedHeaders.length; i++) {
            bytes32 currentBlockHeader = blockHeaders[i];
            if (indexedCounts[currentCountIndex] < indexedCounts[i]) {
                blockHeader = currentBlockHeader;
                currentCountIndex = i;
            }
        }

        /// revert if highest count did not report
        if (blockHeader == bytes32(0)) revert HighestCountDidNotReport(address(this));
        if (indexedCounts[currentCountIndex] < threshold)
            revert ThresholdNotMet(address(this), indexedCounts[currentCountIndex], blockHeader);
    }
}
