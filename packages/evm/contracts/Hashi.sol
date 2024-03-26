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

import { IAdapter } from "./interfaces/IAdapter.sol";
import { IHashi } from "./interfaces/IHashi.sol";

contract Hashi is IHashi {
    /// @inheritdoc IHashi
    function checkHashWithThresholdFromAdapters(
        uint256 domain,
        uint256 id,
        uint256 threshold,
        IAdapter[] calldata adapters
    ) external view returns (bool) {
        if (adapters.length == 0) revert NoAdaptersGiven();
        if (threshold > adapters.length || threshold == 0) revert InvalidThreshold(threshold, adapters.length);

        bytes32[] memory hashes = new bytes32[](adapters.length);
        for (uint256 i = 0; i < adapters.length; ) {
            hashes[i] = adapters[i].getHash(domain, id);
            unchecked {
                ++i;
            }
        }

        for (uint256 i = 0; i < hashes.length; ) {
            if (i > hashes.length - threshold) break;

            bytes32 baseHash = hashes[i];
            if (baseHash == bytes32(0)) {
                unchecked {
                    ++i;
                }
                continue;
            }

            uint256 num = 0;
            for (uint256 j = i; j < hashes.length; ) {
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
    function getHashFromAdapter(uint256 domain, uint256 id, IAdapter adapter) public view returns (bytes32) {
        return adapter.getHash(domain, id);
    }

    /// @inheritdoc IHashi
    function getHashesFromAdapters(
        uint256 domain,
        uint256 id,
        IAdapter[] calldata adapters
    ) public view returns (bytes32[] memory) {
        if (adapters.length == 0) revert NoAdaptersGiven();
        bytes32[] memory hashes = new bytes32[](adapters.length);
        for (uint256 i = 0; i < adapters.length; ) {
            hashes[i] = getHashFromAdapter(domain, id, adapters[i]);
            unchecked {
                ++i;
            }
        }
        return hashes;
    }

    /// @inheritdoc IHashi
    function getHash(uint256 domain, uint256 id, IAdapter[] calldata adapters) external view returns (bytes32 hash) {
        if (adapters.length == 0) revert NoAdaptersGiven();
        bytes32[] memory hashes = getHashesFromAdapters(domain, id, adapters);
        hash = hashes[0];
        if (hash == bytes32(0)) revert HashNotAvailableInAdapter(adapters[0]);
        for (uint256 i = 1; i < hashes.length; ) {
            if (hashes[i] == bytes32(0)) revert HashNotAvailableInAdapter(adapters[i]);
            if (hash != hashes[i]) revert AdaptersDisagree(adapters[i - 1], adapters[i]);
            unchecked {
                ++i;
            }
        }
    }
}
