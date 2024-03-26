// SPDX-License-Identifier: MIT

// NOTE: This special version of the pTokens-erc20-vault is for ETH mainnet, and includes custom
// logic to handle ETHPNT<->PNT fungibility, as well as custom logic to handle GALA tokens after
// they upgraded from v1 to v2.

pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC777/IERC777Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC777/IERC777RecipientUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/IERC1820RegistryUpgradeable.sol";

contract MockVault is Initializable, IERC777RecipientUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    IERC1820RegistryUpgradeable private constant _erc1820 =
        IERC1820RegistryUpgradeable(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
    bytes32 private constant TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");
    bytes32 private constant Erc777Token_INTERFACE_HASH = keccak256("ERC777Token");
    EnumerableSetUpgradeable.AddressSet private supportedTokens;
    bytes4 public ORIGIN_CHAIN_ID;

    event PegIn(
        address _tokenAddress,
        address _tokenSender,
        uint256 _tokenAmount,
        string _destinationAddress,
        bytes _userData,
        bytes4 _originChainId,
        bytes4 _destinationChainId
    );

    function initialize(address[] memory _tokensToSupport, bytes4 _originChainId) public initializer {
        for (uint256 i = 0; i < _tokensToSupport.length; i++) {
            supportedTokens.add(_tokensToSupport[i]);
        }
        _erc1820.setInterfaceImplementer(address(this), TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
        ORIGIN_CHAIN_ID = _originChainId;
    }

    modifier onlySupportedTokens(address _tokenAddress) {
        require(supportedTokens.contains(_tokenAddress), "Token at supplied address is NOT supported!");
        _;
    }

    function pegIn(
        uint256 _tokenAmount,
        address _tokenAddress,
        string calldata _destinationAddress,
        bytes4 _destinationChainId
    ) external returns (bool) {
        return pegIn(_tokenAmount, _tokenAddress, _destinationAddress, "", _destinationChainId);
    }

    function pegIn(
        uint256 _tokenAmount,
        address _tokenAddress,
        string memory _destinationAddress,
        bytes memory _userData,
        bytes4 _destinationChainId
    ) public onlySupportedTokens(_tokenAddress) returns (bool) {
        require(_tokenAmount > 0, "Token amount must be greater than zero!");
        IERC20Upgradeable(_tokenAddress).safeTransferFrom(msg.sender, address(this), _tokenAmount);

        require(_tokenAddress != address(0), "`_tokenAddress` is set to zero address!");

        emit PegIn(
            _tokenAddress,
            msg.sender,
            _tokenAmount,
            _destinationAddress,
            _userData,
            ORIGIN_CHAIN_ID,
            _destinationChainId
        );

        return true;
    }

    /**
     * @dev Implementation of IERC777Recipient.
     */
    function tokensReceived(
        address /*operator*/,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata /*operatorData*/
    ) external override onlySupportedTokens(msg.sender) {
        require(to == address(this), "Token receiver is not this contract");
        if (userData.length > 0) {
            require(amount > 0, "Token amount must be greater than zero!");
            (bytes32 tag, string memory _destinationAddress, bytes4 _destinationChainId) = abi.decode(
                userData,
                (bytes32, string, bytes4)
            );
            require(tag == keccak256("ERC777-pegIn"), "Invalid tag for automatic pegIn on ERC777 send");
            emit PegIn(msg.sender, from, amount, _destinationAddress, userData, ORIGIN_CHAIN_ID, _destinationChainId);
        }
    }

    function pegOut(
        address payable _tokenRecipient,
        address _tokenAddress,
        uint256 _tokenAmount,
        bytes calldata _userData
    ) external returns (bool success) {
        return pegOutTokens(_tokenAddress, _tokenRecipient, _tokenAmount, _userData);
    }

    function pegOutTokens(
        address _tokenAddress,
        address _tokenRecipient,
        uint256 _tokenAmount,
        bytes memory _userData
    ) internal returns (bool success) {
        if (tokenIsErc777(_tokenAddress)) {
            // NOTE: This is an ERC777 token, so let's use its `send` function so that hooks are called...
            IERC777Upgradeable(_tokenAddress).send(_tokenRecipient, _tokenAmount, _userData);
        } else {
            // NOTE: Otherwise, we use standard ERC20 transfer function instead.
            IERC20Upgradeable(_tokenAddress).safeTransfer(_tokenRecipient, _tokenAmount);
        }
        return true;
    }

    function tokenIsErc777(address _tokenAddress) internal view returns (bool) {
        return _erc1820.getInterfaceImplementer(_tokenAddress, Erc777Token_INTERFACE_HASH) != address(0);
    }

    receive() external payable {}

    function changeOriginChainId(bytes4 _newOriginChainId) public returns (bool success) {
        ORIGIN_CHAIN_ID = _newOriginChainId;
        return true;
    }
}
