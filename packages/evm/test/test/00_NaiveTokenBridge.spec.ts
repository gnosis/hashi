import { expect } from "chai"
import { ethers, network } from "hardhat"

const DOMAIN_ID = network.config.chainId
const BYTES32_DOMAIN_ID = "0x0000000000000000000000000000000000000000000000000000000000007A69"
const AMOUNT = 500

const setup = async () => {
  const [wallet] = await ethers.getSigners()

  // deploy hashi
  const Hashi = await ethers.getContractFactory("Hashi")
  const hashi = await Hashi.deploy()

  // deploy ShoyuBashi
  const ShoyuBashi = await ethers.getContractFactory("ShoyuBashi")
  const shoyuBashi = ShoyuBashi.deploy(wallet.address, hashi.address)

  // deploy Yaho
  const Yaho = await ethers.getContractFactory("Yaho")
  const yaho = await Yaho.deploy()

  // deploy AMB
  const AMB = await ethers.getContractFactory("MockAMB")
  const amb = await AMB.deploy()

  // deploy Yaru
  const Yaru = await ethers.getContractFactory("Yaru")
  const yaru = await Yaru.deploy(hashi.address, yaho.address, DOMAIN_ID)

  // deploy Oracle Adapter
  const AMBMessageRelay = await ethers.getContractFactory("AMBMessageRelay")
  const ambMessageRelay = await AMBMessageRelay.deploy(amb.address, yaho.address)
  const AMBAdapter = await ethers.getContractFactory("AMBAdapter")
  const ambAdapter = await AMBAdapter.deploy(amb.address, ambMessageRelay.address, BYTES32_DOMAIN_ID)

  // deploy NaiveTokenBridges
  const NaiveTokenBridge = await ethers.getContractFactory("NaiveTokenBridge")
  const tokenBridgeOne = await NaiveTokenBridge.deploy(wallet.address, yaho.address, yaru.address, DOMAIN_ID)
  const tokenBridgeTwo = await NaiveTokenBridge.deploy(wallet.address, yaho.address, yaru.address, DOMAIN_ID)
  await tokenBridgeOne.setTwin(tokenBridgeTwo.address)
  await tokenBridgeTwo.setTwin(tokenBridgeOne.address)

  // deploy token
  const ERC20Token = await ethers.getContractFactory("LocalToken")
  const erc20Token = await ERC20Token.deploy("Token", "TKN")
  await erc20Token.mint(wallet.address, AMOUNT)

  return {
    amb,
    wallet,
    hashi,
    shoyuBashi,
    yaho,
    yaru,
    tokenBridgeOne,
    tokenBridgeTwo,
    erc20Token,
    ambMessageRelay,
    ambAdapter,
  }
}

describe("Naive Token Bridge", function () {
  describe("End-to-end", function () {
    it("Bridges canonical tokens to mint new local tokens", async function () {
      const { tokenBridgeOne, tokenBridgeTwo, erc20Token, wallet, yaho, yaru, ambMessageRelay, ambAdapter } =
        await setup()
      const predictedAddress = await tokenBridgeOne.calculateTokenTwinAddress(
        tokenBridgeTwo.address,
        erc20Token.address,
        await erc20Token.name(),
        await erc20Token.symbol(),
      )

      await erc20Token.approve(tokenBridgeOne.address, await erc20Token.balanceOf(wallet.address))

      const messageId = await tokenBridgeOne.callStatic.bridgeTokens(erc20Token.address, wallet.address, AMOUNT)
      await tokenBridgeOne.bridgeTokens(erc20Token.address, wallet.address, AMOUNT)
      await yaho.relayMessagesToAdapters([messageId], [ambMessageRelay.address], [ambAdapter.address])

      const call = await tokenBridgeTwo.populateTransaction.mintTokens(
        erc20Token.address,
        wallet.address,
        AMOUNT,
        await erc20Token.name(),
        await erc20Token.symbol(),
      )
      const message = {
        to: tokenBridgeTwo.address,
        toChainId: DOMAIN_ID,
        data: call.data,
      }

      await yaru.executeMessages([message], [messageId], [tokenBridgeOne.address], [ambAdapter.address])

      const twinToken = await ethers.getContractAt("LocalToken", predictedAddress)
      expect(await erc20Token.balanceOf(wallet.address)).to.equal(0)
      expect(await erc20Token.balanceOf(tokenBridgeOne.address)).to.equal(AMOUNT)
      expect(await twinToken.balanceOf(wallet.address)).to.equal(AMOUNT)
    })

    it("Burns local tokens to release canonical tokens", async function () {
      const { tokenBridgeOne, tokenBridgeTwo, erc20Token, wallet, yaho, yaru, ambMessageRelay, ambAdapter } =
        await setup()
      const predictedAddress = await tokenBridgeOne.calculateTokenTwinAddress(
        tokenBridgeTwo.address,
        erc20Token.address,
        await erc20Token.name(),
        await erc20Token.symbol(),
      )

      await erc20Token.approve(tokenBridgeOne.address, await erc20Token.balanceOf(wallet.address))

      const messageIdOne = await tokenBridgeOne.callStatic.bridgeTokens(erc20Token.address, wallet.address, AMOUNT)
      await tokenBridgeOne.bridgeTokens(erc20Token.address, wallet.address, AMOUNT)
      await yaho.relayMessagesToAdapters([messageIdOne], [ambMessageRelay.address], [ambAdapter.address])

      const callOne = await tokenBridgeTwo.populateTransaction.mintTokens(
        erc20Token.address,
        wallet.address,
        AMOUNT,
        await erc20Token.name(),
        await erc20Token.symbol(),
      )
      const messageOne = {
        to: tokenBridgeTwo.address,
        toChainId: DOMAIN_ID,
        data: callOne.data,
      }

      await yaru.executeMessages([messageOne], [messageIdOne], [tokenBridgeOne.address], [ambAdapter.address])

      const twinToken = await ethers.getContractAt("LocalToken", predictedAddress)
      expect(await twinToken.balanceOf(wallet.address)).to.equal(AMOUNT)

      await twinToken.approve(tokenBridgeTwo.address, twinToken.balanceOf(wallet.address))

      const messageIdTwo = await tokenBridgeTwo.callStatic.bridgeTokens(twinToken.address, wallet.address, AMOUNT)
      await tokenBridgeTwo.bridgeTokens(twinToken.address, wallet.address, AMOUNT)

      await yaho.relayMessagesToAdapters([messageIdTwo], [ambMessageRelay.address], [ambAdapter.address])

      const callTwo = await tokenBridgeOne.populateTransaction.releaseTokens(erc20Token.address, wallet.address, AMOUNT)
      const messageTwo = {
        to: tokenBridgeOne.address,
        toChainId: DOMAIN_ID,
        data: callTwo.data,
      }

      await yaru.executeMessages([messageTwo], [messageIdTwo], [tokenBridgeTwo.address], [ambAdapter.address])

      expect(await twinToken.totalSupply()).to.equal(0)
      expect(await erc20Token.totalSupply()).to.equal(AMOUNT)
      expect(await erc20Token.balanceOf(tokenBridgeOne.address)).to.equal(0)
      expect(await erc20Token.balanceOf(wallet.address)).to.equal(AMOUNT)
    })
  })
})
