// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { ShuSo } from "./ShuSo.sol";
import { IAdapter } from "../interfaces/IAdapter.sol";
import { IShoyuBashi } from "../interfaces/IShoyuBashi.sol";
import { IHashi } from "../interfaces/IHashi.sol";

contract ShoyuBashi is IShoyuBashi, ShuSo {
    constructor(address _owner, address _hashi) ShuSo(_owner, _hashi) {} // solhint-disable no-empty-blocks

    /// @inheritdoc IShoyuBashi
    function setThreshold(uint256 domain, uint256 threshold) external {
        _setThreshold(domain, threshold);
    }

    /// @inheritdoc IShoyuBashi
    function enableAdapters(uint256 domain, IAdapter[] memory adapters, uint256 threshold) external {
        _enableAdapters(domain, adapters, threshold);
    }

    /// @inheritdoc IShoyuBashi
    function disableAdapters(uint256 domain, IAdapter[] memory adapters) external {
        _disableAdapters(domain, adapters);
    }

    /// @inheritdoc IShoyuBashi
    function getUnanimousHash(uint256 domain, uint256 id) external view returns (bytes32) {
        return _getUnanimousHash(domain, id);
    }

    /// @inheritdoc IShoyuBashi
    function getThresholdHash(uint256 domain, uint256 id) external view returns (bytes32) {
        return _getThresholdHash(domain, id);
    }

    /// @inheritdoc IShoyuBashi
    function getHash(uint256 domain, uint256 id, IAdapter[] memory adapters) external view returns (bytes32) {
        return _getHash(domain, id, adapters);
    }

    /// @inheritdoc IShoyuBashi
    function setHashi(IHashi _hashi) external {
        _setHashi(_hashi);
    }
}
