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

import "./Hashi.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

struct Link {
    IOracleAdapter previous;
    IOracleAdapter next;
}

struct chain {
    uint256 threshold;
    uint256 count;
}

contract ThresholdHashi is OwnableUpgradeable {
    IOracleAdapter internal constant LIST_END = IOracleAdapter(address(0x1));

    Hashi public hashi;
    mapping(uint256 => mapping(IOracleAdapter => Link)) public adapters;
    mapping(uint256 => chain) public chains;

    event HashiSet(address indexed emitter, Hashi indexed hashi);
    event Init(address indexed emitter, address indexed owner, Hashi indexed hashi);
    event OracleAdaptersEnabled(address indexed emitter, uint256 indexed chainId, IOracleAdapter[] adapters);
    event OracleAdaptersDisabled(address indexed emitter, uint256 indexed chainId, IOracleAdapter[] adapters);
    event ThresholdSet(address indexed emitter, uint256 chainId, uint256 threshold);

    error AdapterNotEnabled(address emitter, IOracleAdapter adapter);
    error AdapterAlreadyEnabled(address emitter, IOracleAdapter adapter);
    error DuplicateHashiAddress(address emitter, Hashi hashi);
    error DuplicateOrOutOfOrderAdapters(address emitter, IOracleAdapter adapterOne, IOracleAdapter adapterTwo);
    error DuplicateThreashold(address emitter, uint256 threshold);
    error InvalidAdapter(address emitter, IOracleAdapter adapter);
    error NoAdaptersEnabled(address emitter, uint256 chainId);
    error NoAdaptersGiven(address emitter);
    error SetupAdaptersAlreadyCalled(address emitter);
    error ThresholdNotMet(address emitter);

    constructor(address _owner, address _hashi) {
        bytes memory initParams = abi.encode(_owner, _hashi);
        init(initParams);
    }

    function init(bytes memory initParams) public initializer {
        (address _owner, Hashi _hashi) = abi.decode(initParams, (address, Hashi));
        __Ownable_init();
        setHashi(_hashi);
        transferOwnership(_owner);
        emit Init(address(this), _owner, _hashi);
    }

    /// @dev Sets the address of the Hashi contract.
    /// @param _hashi Address of the hashi contract.
    /// @notice Only callable by the owner of this contract.
    function setHashi(Hashi _hashi) public onlyOwner {
        if (hashi == _hashi) revert DuplicateHashiAddress(address(this), _hashi);
        hashi = _hashi;
        emit HashiSet(address(this), hashi);
    }

    /// @dev Sets the threshold of adapters required for a given chainId.
    /// @param chainId Uint256 identifier for the chain for which to set the threshold.
    /// @param threshold Uint256 threshold to set for the given chain.
    /// @notice Only callable by the owner of this contract.
    function setThreshold(uint256 chainId, uint256 threshold) public onlyOwner {
        if (chains[chainId].threshold == threshold) revert DuplicateThreashold(address(this), threshold);
        chains[chainId].threshold = threshold;
        emit ThresholdSet(address(this), chainId, threshold);
    }

    /// @dev Enables the given adapters for a given chainId.
    /// @param chainId Uint256 identifier for the chain for which to set oracle adapters.
    /// @param _adapters Arracy of oracleAdapter addresses. Must be in numberical order from smallest to largest and contain no duplicates.
    /// @notice Reverts if _adapters are out of order or contain duplicates.
    /// @notice Only callable by the owner of this contract.
    function enableOracleAdapters(uint256 chainId, IOracleAdapter[] memory _adapters) public onlyOwner {
        if (adapters[chainId][LIST_END].next == IOracleAdapter(address(0))) {
            adapters[chainId][LIST_END].next = LIST_END;
            adapters[chainId][LIST_END].previous = LIST_END;
        }
        if (_adapters.length == 0) revert NoAdaptersGiven(address(this));
        for (uint i = 0; i < _adapters.length; i++) {
            IOracleAdapter adapter = _adapters[i];
            if (adapter == IOracleAdapter(address(0)) || adapter == LIST_END)
                revert InvalidAdapter(address(this), adapter);
            // if (i > 0 && adapter <= _adapters[i - 1])
            //     revert DuplicateOrOutOfOrderAdapters(address(this), adapter, _adapters[i - 1]);
            if (adapters[chainId][adapter].next != IOracleAdapter(address(0)))
                revert AdapterAlreadyEnabled(address(this), adapter);
            IOracleAdapter previous = adapters[chainId][LIST_END].previous;
            adapters[chainId][previous].next = adapter;
            adapters[chainId][adapter].previous = previous;
            adapters[chainId][LIST_END].previous = adapter;
            adapters[chainId][adapter].next = LIST_END;
            chains[chainId].count++;
        }
        emit OracleAdaptersEnabled(address(this), chainId, _adapters);
    }

    /// @dev Disables the given adapters for a given chainId.
    /// @param chainId Uint256 identifier for the chain for which to set oracle adapters.
    /// @param _adapters Arracy of oracleAdapter addresses. Must be in numberical order from smallest to largest and contain no duplicates.
    /// @notice Reverts if _adapters are out of order or contain duplicates.
    /// @notice Only callable by the owner of this contract.
    function disableOracleAdapters(uint256 chainId, IOracleAdapter[] memory _adapters) public onlyOwner {
        if (chains[chainId].count == 0) revert NoAdaptersEnabled(address(this), chainId);
        if (_adapters.length == 0) revert NoAdaptersGiven(address(this));
        for (uint i = 0; i < _adapters.length; i++) {
            IOracleAdapter adapter = _adapters[i];
            if (adapter == IOracleAdapter(address(0)) || adapter == LIST_END)
                revert InvalidAdapter(address(this), adapter);
            // if (i > 0 && adapter <= _adapters[i - 1])
            //     revert DuplicateOrOutOfOrderAdapters(address(this), adapter, _adapters[i - 1]);
            if (adapters[chainId][adapter].next == IOracleAdapter(address(0)))
                revert AdapterNotEnabled(address(this), adapter);
            IOracleAdapter next = adapters[chainId][adapter].next;
            IOracleAdapter previous = adapters[chainId][adapter].previous;
            adapters[chainId][next].previous = previous;
            adapters[chainId][previous].next = next;
            adapters[chainId][adapter].next = IOracleAdapter(address(0));
            adapters[chainId][adapter].previous = IOracleAdapter(address(0));
            chains[chainId].count--;
        }
        emit OracleAdaptersDisabled(address(this), chainId, _adapters);
    }

    /// @dev Returns an array of enabled oracle adapters for a given chainId.
    /// @param chainId Uint256 identifier for the chain for which to list oracle adapters.
    function getOracleAdapters(uint256 chainId) public view returns (IOracleAdapter[] memory) {
        IOracleAdapter[] memory _adapters = new IOracleAdapter[](chains[chainId].count);
        IOracleAdapter currentAdapter = adapters[chainId][LIST_END].next;
        for (uint i = 0; i < _adapters.length; i++) {
            _adapters[i] = currentAdapter;
            currentAdapter = adapters[chainId][currentAdapter].next;
        }
        return _adapters;
    }

    /// @dev Returns the block header unanimously agreed upon by ALL of the enabled oraclesAdapters for a given block on a given chainId.
    /// @param chainId Uint256 identifier for the chain to query.
    /// @param blockNumber Uint256 identifier for the block number to query.
    /// @return blockHeader Bytes32 block header agreed upon by the oracles for the given chainId.
    /// @notice Reverts if _adapters are out of order or contain duplicates.
    /// @notice Reverts if oracles disagree.
    /// @notice Reverts if oracles have not yet reported the header for the given block.
    /// @notice Reverts if the no oracles are set for the given chainId.
    function getUnanimousHeader(uint256 chainId, uint256 blockNumber) public view returns (bytes32 blockHeader) {
        IOracleAdapter[] memory _adapters = getOracleAdapters(chainId);
        if (chains[chainId].count == 0) revert NoAdaptersEnabled(address(this), chainId);
        if (_adapters.length < chains[chainId].threshold) revert ThresholdNotMet(address(this));
        blockHeader = hashi.getUnanimousHeader(_adapters, chainId, blockNumber);
    }

    /// @dev Returns the block header unanimously agreed upon by all of the given oraclesAdapters for a given block on a given chainId.
    /// @param chainId Uint256 identifier for the chain to query.
    /// @param _adapters Array of oracle adapter addresses to query. Must be in numberical order from smallest to largest and contain no duplicates.
    /// @param blockNumber Uint256 identifier for the block number to query.
    /// @return blockHeader Bytes32 block header agreed upon by the oracles for the given chainId.
    /// @notice Reverts if _adapters are out of order or contain duplicates.
    /// @notice Reverts if oracles disagree.
    /// @notice Reverts if oracles have not yet reported the header for the given block.
    /// @notice Reverts if the no oracles are set for the given chainId.
    function getHeader(
        uint256 chainId,
        uint256 blockNumber,
        IOracleAdapter[] memory _adapters
    ) public view returns (bytes32 blockHeader) {
        if (_adapters.length < chains[chainId].threshold) revert ThresholdNotMet(address(this));
        for (uint i = 1; i < _adapters.length; i++) {
            IOracleAdapter adapter = _adapters[i];
            if (adapter <= _adapters[i - 1])
                revert DuplicateOrOutOfOrderAdapters(address(this), adapter, _adapters[i - 1]);
            if (adapters[chainId][adapter].next == IOracleAdapter(address(0)))
                revert InvalidAdapter(address(this), adapter);
        }
        blockHeader = hashi.getUnanimousHeader(_adapters, chainId, blockNumber);
    }
}
