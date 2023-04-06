// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./LocalToken.sol";
import "../Yaho.sol";
import "../Yaru.sol";

contract NaiveTokenBridge is OwnableUpgradeable {
    using SafeERC20Upgradeable for ERC20Upgradeable;

    Yaho public yaho;
    Yaru public yaru;
    uint256 public destinationChain;
    address public twin;
    mapping(address => address) public tokenTwins;

    event TokensBridged(address emitter, address token, address receiver, uint256 amount);
    event TokensReleased(address emitter, address token, address receiver, uint256 amount);

    error InsuffientTokenBalance(address emitter, address sender, address token, uint256 amount);
    error InvalidCaller(address emitter, address caller);
    error InvalidSender(address emitter, address sender);

    constructor(address _owner, Yaho _yaho, Yaru _yaru, uint256 _destinationChain) {
        initialize(_owner, _yaho, _yaru, _destinationChain);
    }

    function initialize(address _owner, Yaho _yaho, Yaru _yaru, uint256 _destinationChain) public initializer {
        yaho = _yaho;
        yaru = _yaru;
        destinationChain = _destinationChain;
        __Ownable_init();
        transferOwnership(_owner);
    }

    function setTwin(address _twin) public onlyOwner {
        twin = _twin;
    }

    modifier onlyValid() {
        if (msg.sender != address(yaru)) revert InvalidCaller(address(this), msg.sender);
        if (yaru.sender() != twin) revert InvalidSender(address(this), yaru.sender());
        _;
    }

    /// calls yaho.dispatchMessage with a payload to trigger twin.releaseTokens
    function bridgeTokens(address token, address receiver, uint256 amount) external returns (bytes32 messageId) {
        if (ERC20Upgradeable(token).allowance(msg.sender, address(this)) < amount)
            revert InsuffientTokenBalance(address(this), msg.sender, token, amount);

        ERC20Upgradeable(token).transferFrom(msg.sender, address(this), amount);
        address tokenTwin = tokenTwins[token];
        bytes memory data;
        if (tokenTwin != address(0)) {
            LocalToken(address(token)).burn(amount);
            data = abi.encodeCall(
                NaiveTokenBridge.releaseTokens,
                (tokenTwin, receiver, amount, ERC20Upgradeable(token).name(), ERC20Upgradeable(token).symbol())
            );
        } else {
            data = abi.encodeCall(
                NaiveTokenBridge.releaseTokens,
                (token, receiver, amount, ERC20Upgradeable(token).name(), ERC20Upgradeable(token).symbol())
            );
        }

        Message[] memory messages = new Message[](1);
        messages[0] = Message({ to: twin, toChainId: destinationChain, data: data });
        bytes32[] memory messageIds = new bytes32[](1);
        messageIds = yaho.dispatchMessages(messages);
        messageId = messageIds[0];

        emit TokensBridged(address(this), token, receiver, amount);
    }

    /// called by yaru.executeMessages, only callable by yaru and if yaru.sender == twin
    function releaseTokens(
        address token,
        address receiver,
        uint256 amount,
        string memory name,
        string memory symbol
    ) external onlyValid {
        address calculatedAddress = calculateTokenTwinAddress(
            address(this),
            token,
            ERC20Upgradeable(token).name(),
            ERC20Upgradeable(token).symbol()
        );

        /// if no code is deployed at address, deploy new token.
        if (!AddressUpgradeable.isContract(calculatedAddress)) {
            address localToken = address(new LocalToken{ salt: keccak256(abi.encode(token)) }(name, symbol));
            tokenTwins[calculatedAddress] = token;
            require(localToken == calculatedAddress, "not equal");
        }

        /// if non-local token, release held tokens, else mint new tokens.
        if (tokenTwins[calculatedAddress] == address(0)) {
            ERC20Upgradeable(token).transfer(receiver, amount);
        } else {
            LocalToken(calculatedAddress).mint(receiver, amount);
        }

        emit TokensReleased(address(this), token, receiver, amount);
    }

    function calculateTokenTwinAddress(
        address creator,
        address token,
        string memory name,
        string memory symbol
    ) public pure returns (address calculatedAddress) {
        calculatedAddress = address(
            uint160(
                uint(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            creator,
                            keccak256(abi.encode(token)),
                            keccak256(abi.encodePacked(type(LocalToken).creationCode, abi.encode(name, symbol)))
                        )
                    )
                )
            )
        );
    }
}
