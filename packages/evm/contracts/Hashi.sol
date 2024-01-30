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

                                           Made with ❤️ by Gnosis Guild
*/
// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { IOracleAdapter } from "./interfaces/IOracleAdapter.sol";
import { IHashi } from "./interfaces/IHashi.sol";

contract Hashi is IHashi {
    /// @inheritdoc IHashi
    function checkHashWithThresholdFromOracles(
        uint256 domain,
        uint256 id,
        uint256 threshold,
        IOracleAdapter[] calldata oracleAdapters
    ) external view returns (bool) {
        if (oracleAdapters.length == 0) revert NoOracleAdaptersGiven();
        if (threshold > oracleAdapters.length || threshold == 0)
            revert InvalidThreshold(threshold, oracleAdapters.length);

        bytes32[] memory hashes = new bytes32[](oracleAdapters.length);
        for (uint256 i = 0; i < oracleAdapters.length; ) {
            try oracleAdapters[i].getHashFromOracle(domain, id) returns (bytes32 hash) {
                hashes[i] = hash;
            } catch {} // solhint-disable no-empty-blocks
            unchecked {
                ++i;
            }
        }

        for (uint256 i = 0; i < hashes.length; ) {
            bytes32 baseHash = hashes[i];
            if (baseHash == bytes32(0)) {
                unchecked {
                    ++i;
                }
                continue;
            }

            uint256 num = 0;
            for (uint256 j = 0; j < hashes.length; ) {
                if (baseHash == hashes[j]) {
                    unchecked {
                        ++num;
                    }
                    if (num == threshold) return true;
                }
                unchecked {
                    ++j;
                }
            }

            unchecked {
                ++i;
            }
        }
        return false;
    }

    /// @inheritdoc IHashi
    function getHashFromOracle(uint256 domain, uint256 id, IOracleAdapter oracleAdapter) public view returns (bytes32) {
        return oracleAdapter.getHashFromOracle(domain, id);
    }

    /// @inheritdoc IHashi
    function getHashesFromOracles(
        uint256 domain,
        uint256 id,
        IOracleAdapter[] calldata oracleAdapters
    ) public view returns (bytes32[] memory) {
        if (oracleAdapters.length == 0) revert NoOracleAdaptersGiven();
        bytes32[] memory hashes = new bytes32[](oracleAdapters.length);
        for (uint256 i = 0; i < oracleAdapters.length; ) {
            hashes[i] = getHashFromOracle(domain, id, oracleAdapters[i]);
            unchecked {
                ++i;
            }
        }
        return hashes;
    }

    /// @inheritdoc IHashi
    function getHash(
        uint256 domain,
        uint256 id,
        IOracleAdapter[] calldata oracleAdapters
    ) external view returns (bytes32 hash) {
        if (oracleAdapters.length == 0) revert NoOracleAdaptersGiven();
        bytes32[] memory hashes = getHashesFromOracles(domain, id, oracleAdapters);
        hash = hashes[0];
        if (hash == bytes32(0)) revert OracleDidNotReport(oracleAdapters[0]);
        for (uint256 i = 1; i < hashes.length; ) {
            if (hashes[i] == bytes32(0)) revert OracleDidNotReport(oracleAdapters[i]);
            if (hash != hashes[i]) revert OraclesDisagree(oracleAdapters[i - 1], oracleAdapters[i]);
            unchecked {
                ++i;
            }
        }
    }
}
