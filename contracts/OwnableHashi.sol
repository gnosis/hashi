// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "./Hashi.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract OwnableHashi is OwnableUpgradeable {
    Hashi public hashi;
    mapping(uint256 => IOracleAdapter[]) public oracleAdapters;

    event Initialized(address indexed emitter, address indexed owner, Hashi indexed hashi);
    event HashiSet(address indexed emitter, Hashi indexed hashi);
    event OracleAdaptersSet(address indexed emitter, uint256 indexed chainId, IOracleAdapter[] oracleAdapters);

    error HashiAlreadySetToThisAddress(address emitter, Hashi hashi);

    constructor(address _owner, address _hashi) {
        bytes memory initParams = abi.encode(_owner, _hashi);
        init(initParams);
    }

    function init(bytes memory initParams) public initializer {
        (address _owner, Hashi _hashi) = abi.decode(initParams, (address, Hashi));
        __Ownable_init();
        setHashi(_hashi);
        transferOwnership(_owner);
        emit Initialized(address(this), _owner, _hashi);
    }

    /// @dev Returns the block header unanimously agreed upon by all of the oraclesAdapters for a given block on a given chainId.
    /// @param chainId Uint256 identifier for the chain to query.
    /// @param blockNumber Uint256 identifier for the block number to query.
    /// @return blockHeader Bytes32 block header agreed upon by the oracles for the given chainId.
    /// @notice Reverts if oracles disagree.
    /// @notice Reverts if oracles have not yet reported the header for the given block.
    /// @notice Reverts if the no oracles are set for the given chainId.
    function getHeader(uint256 chainId, uint256 blockNumber) public view returns (bytes32 blockHeader) {
        blockHeader = hashi.getUnanimousHeader(oracleAdapters[chainId], chainId, blockNumber);
    }

    /// @dev Sets the address of the Hashi contract.
    /// @param _hashi Address of the hashi contract.
    /// @notice Only callable by the owner of this contract.
    function setHashi(Hashi _hashi) public onlyOwner {
        if (hashi == _hashi) revert HashiAlreadySetToThisAddress(address(this), _hashi);
        hashi = _hashi;
        emit HashiSet(address(this), hashi);
    }

    /// @dev Sets the array of oracle adapter for a given chainID.
    /// @param chainId Uint256 identifier for the chain for which to set oracle adapters.
    /// @param _oracleAdapters Arracy of oracleAdapter addresses.
    function setOracleAdapters(uint256 chainId, IOracleAdapter[] memory _oracleAdapters) public onlyOwner {
        oracleAdapters[chainId] = _oracleAdapters;
        emit OracleAdaptersSet(address(this), chainId, _oracleAdapters);
    }
}
