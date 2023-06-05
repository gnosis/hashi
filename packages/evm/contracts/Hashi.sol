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
pragma solidity ^0.8.17;

import { IOracleAdapter } from "./interfaces/IOracleAdapter.sol";

contract Hashi {
    error NoOracleAdaptersGiven(address emitter);
    error OracleDidNotReport(address emitter, IOracleAdapter oracleAdapter);
    error OraclesDisagree(address emitter, IOracleAdapter oracleOne, IOracleAdapter oracleTwo);

    /// @dev Returns the hash reported by a given oracle for a given ID.
    /// @param oracleAdapter Address of the oracle adapter to query.
    /// @param domain Id of the domain to query.
    /// @param id ID for which to return a hash.
    /// @return hash Hash reported by the given oracle adapter for the given ID number.
    function getHashFromOracle(
        IOracleAdapter oracleAdapter,
        uint256 domain,
        uint256 id
    ) public view returns (bytes32 hash) {
        hash = oracleAdapter.getHashFromOracle(domain, id);
    }

    /// @dev Returns the hash for a given ID reported by a given set of oracles.
    /// @param oracleAdapters Array of address for the oracle adapters to query.
    /// @param domain ID of the domain to query.
    /// @param id ID for which to return hashs.
    /// @return hashes Array of hash reported by the given oracle adapters for the given ID.
    function getHashesFromOracles(
        IOracleAdapter[] memory oracleAdapters,
        uint256 domain,
        uint256 id
    ) public view returns (bytes32[] memory) {
        if (oracleAdapters.length == 0) revert NoOracleAdaptersGiven(address(this));
        bytes32[] memory hashes = new bytes32[](oracleAdapters.length);
        for (uint256 i = 0; i < oracleAdapters.length; i++) {
            hashes[i] = getHashFromOracle(oracleAdapters[i], domain, id);
        }
        return hashes;
    }

    /// @dev Returns the hash unanimously agreed upon by a given set of oracles.
    /// @param domain ID of the domain to query.
    /// @param id ID for which to return hash.
    /// @param oracleAdapters Array of address for the oracle adapters to query.
    /// @return hash Hash agreed on by the given set of oracle adapters.
    /// @notice MUST revert if oracles disagree on the hash or if an oracle does not report.
    function getHash(
        uint256 domain,
        uint256 id,
        IOracleAdapter[] memory oracleAdapters
    ) public view returns (bytes32 hash) {
        if (oracleAdapters.length == 0) revert NoOracleAdaptersGiven(address(this));
        bytes32[] memory hashes = getHashesFromOracles(oracleAdapters, domain, id);
        hash = hashes[0];
        if (hash == bytes32(0)) revert OracleDidNotReport(address(this), oracleAdapters[0]);
        for (uint256 i = 1; i < hashes.length; i++) {
            if (hashes[i] == bytes32(0)) revert OracleDidNotReport(address(this), oracleAdapters[i]);
            if (hash != hashes[i]) revert OraclesDisagree(address(this), oracleAdapters[i - 1], oracleAdapters[i]);
        }
    }
}
