// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { ShuSo } from "./ShuSo.sol";
import { IAdapter } from "../interfaces/IAdapter.sol";
import { IHashi } from "../interfaces/IHashi.sol";
import { IShoyuBashi } from "../interfaces/IShoyuBashi.sol";

contract ShoyuBashi is IShoyuBashi, ShuSo {
    constructor(address _owner, address _hashi) ShuSo(_owner, _hashi) {} // solhint-disable no-empty-blocks

    function setHashi(IHashi _hashi) public override {
        _setHashi(_hashi);
    }

    /// @inheritdoc IShoyuBashi
    function setThreshold(uint256 domain, uint256 threshold) public {
        _setThreshold(domain, threshold);
    }

    /// @inheritdoc IShoyuBashi
    function enableAdapters(uint256 domain, IAdapter[] memory _adapters) public {
        _enableAdapters(domain, _adapters);
    }

    /// @inheritdoc IShoyuBashi
    function disableAdapters(uint256 domain, IAdapter[] memory _adapters) public {
        _disableAdapters(domain, _adapters);
    }

    /// @inheritdoc IShoyuBashi
    function getUnanimousHash(uint256 domain, uint256 id) public view returns (bytes32) {
        return _getUnanimousHash(domain, id);
    }

    /// @inheritdoc IShoyuBashi
    function getThresholdHash(uint256 domain, uint256 id) public view returns (bytes32) {
        return _getThresholdHash(domain, id);
    }

    /// @inheritdoc IShoyuBashi
    function getHash(uint256 domain, uint256 id, IAdapter[] memory _adapters) public view returns (bytes32) {
        return _getHash(domain, id, _adapters);
    }
}
