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

    modifier onlyValid() {
        if (msg.sender != address(yaru)) revert InvalidCaller(address(this), msg.sender);
        if (yaru.sender() != twin) revert InvalidSender(address(this), yaru.sender());
        _;
    }

    /// calls yaho.dispatchMessage with a payload to trigger twin.releaseTokens
    function bridgeTokens(address token, address receiver, uint256 amount) external {
        if (ERC20Upgradeable(token).allowance(msg.sender, address(this)) < amount)
            revert InsuffientTokenBalance(address(this), msg.sender, token, amount);

        ERC20Upgradeable(token).transferFrom(msg.sender, address(this), amount);

        address tokenTwin = tokenTwins[address(token)];
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
        yaho.dispatchMessages(messages);
        emit tokensBridged(address(this), token, receiver, amount);
    }

    /// called by yaru.executeMessages, only callable by yaru and if yaru.sender == twin
    function releaseTokens(
        address token,
        address receiver,
        uint256 amount,
        string memory name,
        string memory symbol
    ) external onlyValid {
        /// If no, deploy contract
        /// If yes, check if localToken
        /// If yes, mint tokens
        /// If no, transfer tokens

        address calculatedAddress = calculatedAddress(
            address(this),
            token,
            ERC20Upgradeable.name(),
            ERC20Upgradeable.symbol()
        );
        /// no code is deployed at address, deploy new token.
        if (!AddressUpgradeable.isContract(calculatedAddress))
            tokenTwins[address(new LocalToken{ salt: keccak256(abi.encode(token)) }(name, symbol))] = token;
        if (tokenTwins[token] == address(0)) {
            ERC20Upgradeable(token).transfer(receiver, amount);
        } else {
            LocalToken(token).mint(receiver, amount);
        }
        emit tokensReleased(address(this), token, receiver, amount);
    }

    function calculateTwinAddress(
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
