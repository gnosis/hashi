// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import { Yaru } from "../Yaru.sol";
import { Module, Enum } from "@gnosis.pm/zodiac/contracts/core/Module.sol";

contract HashiModule is Module {
    event HashiModuleSetup(address indexed initiator, address indexed owner, address indexed avatar, address target);

    Yaru public yaru;
    address public controller;
    uint256 public chainId;

    /// @param _owner Address of the  owner
    /// @param _avatar Address of the avatar (e.g. a Safe)
    /// @param _target Address of the contract that will call exec function
    /// @param _yaru Address of the Yaru contract
    /// @param _controller Address of the authorized controller contract on the other side of the bridge
    /// @param _chainId Address of the authorized chainId from which owner can initiate transactions
    constructor(address _owner, address _avatar, address _target, Yaru _yaru, address _controller, uint256 _chainId) {
        bytes memory initParams = abi.encode(_owner, _avatar, _target, _yaru, _controller, _chainId);
        setUp(initParams);
    }

    function setUp(bytes memory initParams) public override {
        (address _owner, address _avatar, address _target, Yaru _yaru, address _controller, uint256 _chainId) = abi
            .decode(initParams, (address, address, address, Yaru, address, uint256));
        __Ownable_init();

        require(_avatar != address(0), "Avatar can not be zero address");
        require(_target != address(0), "Target can not be zero address");
        avatar = _avatar;
        target = _target;
        yaru = _yaru;
        controller = _controller;
        chainId = _chainId;

        transferOwnership(_owner);

        emit HashiModuleSetup(msg.sender, _owner, _avatar, _target);
    }

    /// @dev Check that the yaru, chainId, and owner are valid
    modifier onlyValid() {
        require(msg.sender == address(yaru), "Unauthorized yaru");
        require(yaru.chainId() == chainId, "Unauthorized chainId");
        require(yaru.sender() == controller, "Unauthorized controller");
        _;
    }

    /// @dev Set the Yaru contract address
    /// @param _yaru Address of the Yaru contract
    /// @notice This can only be called by the owner
    function setYaru(address _yaru) public onlyOwner {
        require(address(yaru) != _yaru, "Yaru address already set to this");
        yaru = Yaru(_yaru);
    }

    /// @dev Set the approved chainId
    /// @param _chainId ID of the approved network
    /// @notice This can only be called by the owner
    function setChainId(uint256 _chainId) public onlyOwner {
        require(chainId != _chainId, "chainId already set to this");
        chainId = _chainId;
    }

    /// @dev Set the controller address
    /// @param _controller Set the address of controller on the other side of the bridge
    /// @notice This can only be called by the owner
    function setController(address _controller) public onlyOwner {
        require(controller != _controller, "controller already set to this");
        controller = _controller;
    }

    /// @dev Executes a transaction initated by the Yaru
    /// @param to Target of the transaction that should be executed
    /// @param value Wei value of the transaction that should be executed
    /// @param data Data of the transaction that should be executed
    /// @param operation Operation (Call or Delegatecall) of the transaction that should be executed
    function executeTransaction(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation
    ) public onlyValid {
        require(exec(to, value, data, operation), "Module transaction failed");
    }
}
