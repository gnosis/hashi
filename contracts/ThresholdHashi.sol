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

contract ThresholdHashi is OwnableUpgradeable {
    IOracleAdapter internal constant LIST_END = IOracleAdapter(address(0x1));

    Hashi public hashi;
    mapping(uint256 => mapping(IOracleAdapter => Link)) public adapters;
    mapping(uint256 => uint256) public thresholds;

    event Initialized(address indexed emitter, address indexed owner, Hashi indexed hashi);
    event HashiSet(address indexed emitter, Hashi indexed hashi);
    event ThresholdSet(address indexed emitter, uint256 chainId, uint256 threshold);
    event OracleAdaptersSet(address indexed emitter, uint256 indexed chainId, IOracleAdapter[] adapters);

    error HashiAlreadySetToThisAddress(address emitter, Hashi hashi);
    error DuplicateOrOutOfOrderAdapters(address emitter, IOracleAdapter adapterOne, IOracleAdapter adapterTwo);
    error InvalidAdapter(address emitter, IOracleAdapter adapter);
    error AdapterAlreadyEnabled(address emitter, IOracleAdapter adapter);
    error AdapterAlreadyDisabled(address emitter, IOracleAdapter adapter);
    error ThresholdNotMet(address emitter);
    error SetupAdaptersAlreadyCalled(address emitter);

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
    /// @notice Reverts if _adapters are out of order or contain duplicates.
    /// @notice Reverts if oracles disagree.
    /// @notice Reverts if oracles have not yet reported the header for the given block.
    /// @notice Reverts if the no oracles are set for the given chainId.
    function getUnaninousHeader(uint256 chainId, uint256 blockNumber) public view returns (bytes32 blockHeader) {
        IOracleAdapter[] memory _adapters = getOracleAdapters(chainId);
        if (_adapters.length < thresholds[chainId]) revert ThresholdNotMet(address(this));
        for (uint i = 1; i < _adapters.length; i++) {
            IOracleAdapter adapter = _adapters[i];
            if (adapter <= _adapters[i - 1])
                revert DuplicateOrOutOfOrderAdapters(address(this), adapter, _adapters[i - 1]);
            if (adapters[chainId][adapter].next == IOracleAdapter(address(0)))
                revert InvalidAdapter(address(this), adapter);
        }
        blockHeader = getHeader(chainId, _adapters, blockNumber);
    }

    /// @dev Returns the block header unanimously agreed upon by all of the oraclesAdapters for a given block on a given chainId.
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
        IOracleAdapter[] memory _adapters,
        uint256 blockNumber
    ) public view returns (bytes32 blockHeader) {
        if (_adapters.length < thresholds[chainId]) revert ThresholdNotMet(address(this));
        for (uint i = 1; i < _adapters.length; i++) {
            IOracleAdapter adapter = _adapters[i];
            if (adapter <= _adapters[i - 1])
                revert DuplicateOrOutOfOrderAdapters(address(this), adapter, _adapters[i - 1]);
            if (adapters[chainId][adapter].next == IOracleAdapter(address(0)))
                revert InvalidAdapter(address(this), adapter);
        }
        blockHeader = hashi.getUnanimousHeader(_adapters, chainId, blockNumber);
    }

    /// @dev Returns an array of enabled oracle adapters for a given chainId.
    /// @param chainId Uint256 identifier for the chain for which to list oracle adapters.
    function getOracleAdapters(uint256 chainId) public view returns (IOracleAdapter[] memory _adapters) {
        bytes memory adaptersBytes;
        IOracleAdapter currentAdapter = adapters[chainId][LIST_END].next;
        while (currentAdapter != LIST_END) {
            adaptersBytes = bytes.concat(adaptersBytes, abi.encode(currentAdapter));
            currentAdapter = adapters[chainId][currentAdapter].next;
        }
        _adapters = abi.decode(adaptersBytes, (IOracleAdapter[]));
    }

    /// @dev Sets the address of the Hashi contract.
    /// @param _hashi Address of the hashi contract.
    /// @notice Only callable by the owner of this contract.
    function setHashi(Hashi _hashi) public onlyOwner {
        if (hashi == _hashi) revert HashiAlreadySetToThisAddress(address(this), _hashi);
        hashi = _hashi;
        emit HashiSet(address(this), hashi);
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
        for (uint i = 1; i < _adapters.length; i++) {
            IOracleAdapter adapter = _adapters[i];
            if (adapter <= _adapters[i - 1])
                revert DuplicateOrOutOfOrderAdapters(address(this), adapter, _adapters[i - 1]);
            if (adapters[chainId][adapter].next != IOracleAdapter(address(0)))
                revert AdapterAlreadyEnabled(address(this), adapter);
            IOracleAdapter previous = adapters[chainId][LIST_END].previous;
            adapters[chainId][previous].next = adapter;
            adapters[chainId][adapter].previous = LIST_END;
            adapters[chainId][LIST_END].previous = adapter;
            adapters[chainId][adapter].next = LIST_END;
        }
        emit OracleAdaptersSet(address(this), chainId, _adapters);
    }

    /// @dev Disables the given adapters for a given chainId.
    /// @param chainId Uint256 identifier for the chain for which to set oracle adapters.
    /// @param _adapters Arracy of oracleAdapter addresses. Must be in numberical order from smallest to largest and contain no duplicates.
    /// @notice Reverts if _adapters are out of order or contain duplicates.
    /// @notice Only callable by the owner of this contract.
    function disableOracleAdapters(uint256 chainId, IOracleAdapter[] memory _adapters) public onlyOwner {
        for (uint i = 1; i < _adapters.length; i++) {
            IOracleAdapter adapter = _adapters[i];
            if (adapter <= _adapters[i - 1])
                revert DuplicateOrOutOfOrderAdapters(address(this), adapter, _adapters[i - 1]);
            if (adapters[chainId][adapter].next == IOracleAdapter(address(0)))
                revert AdapterAlreadyDisabled(address(this), adapter);
            IOracleAdapter next = adapters[chainId][adapter].next;
            IOracleAdapter previous = adapters[chainId][adapter].previous;
            adapters[chainId][next].previous = previous;
            adapters[chainId][previous].next = next;
            adapters[chainId][adapter].next = IOracleAdapter(address(0));
            adapters[chainId][adapter].previous = IOracleAdapter(address(0));
        }
        emit OracleAdaptersSet(address(this), chainId, _adapters);
    }

    /// @dev Sets the threshold of adapters required for a given chainId.
    /// @param chainId Uint256 identifier for the chain for which to set the threshold.
    /// @param threshold Uint256 threshold to set for the given chain.
    /// @notice Only callable by the owner of this contract.
    function setThreshold(uint256 chainId, uint256 threshold) public onlyOwner {
        thresholds[chainId] = threshold;
        emit ThresholdSet(address(this), chainId, threshold);
    }
}
