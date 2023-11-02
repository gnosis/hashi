import { expect } from "chai"
import { ethers, network } from "hardhat"

import { ZERO_ADDRESS, deployErc1820Registry, resetNetwork } from "./utils.spec"

const DOMAIN_ID = "0x0000000000000000000000000000000000000000000000000000000000007a69"

describe("PNetworkMessageRelayer", function () {
  describe("Native Network", () => {
    const setup = async () => {
      await resetNetwork()
      const [wallet] = await ethers.getSigners()
      const Yaho = await ethers.getContractFactory("Yaho")
      const yaho = await Yaho.deploy()
      await deployErc1820Registry(wallet)
      const ERC777Token = await ethers.getContractFactory("ERC777Token")
      const erc777Token = await ERC777Token.deploy("ERC777 Token", "E777", [])
      const anotherErc777Token = await ERC777Token.deploy("Another ERC777 Token", "A777", [])
      const Vault = await ethers.getContractFactory("MockVault")
      const vault = await Vault.deploy()
      await vault.initialize([erc777Token.address, anotherErc777Token.address], "0x12345678")
      const PNetworkMessageRelay = await ethers.getContractFactory("PNetworkMessageRelay")
      const pNetworkMessageRelay = await PNetworkMessageRelay.deploy(vault.address, erc777Token.address, yaho.address)
      await pNetworkMessageRelay.addNetwork("0x87654321")
      await pNetworkMessageRelay.addNetwork("0x11223344")

      await erc777Token.connect(wallet).send(pNetworkMessageRelay.address, 10000, "0x")

      const PNetworkAdapter = await ethers.getContractFactory("PNetworkAdapter")
      const pNetworkAdapter = await PNetworkAdapter.deploy(vault.address, pNetworkMessageRelay.address, DOMAIN_ID)
      const PingPong = await ethers.getContractFactory("PingPong")
      const pingPong = await PingPong.deploy()
      const message_1 = {
        to: pingPong.address,
        toChainId: 1,
        data: pingPong.interface.getSighash("ping"),
      }

      await yaho.dispatchMessages([message_1, message_1])

      return {
        erc777Token,
        anotherErc777Token,
        vault,
        wallet,
        yaho,
        pNetworkMessageRelay,
        pNetworkAdapter,
        message_1,
        pingPong,
      }
    }

    describe("Deploy", function () {
      it("Successfully deploys contract", async function () {
        const { pNetworkMessageRelay, erc777Token, vault, yaho } = await setup()
        expect(await pNetworkMessageRelay.deployed())
        expect(await pNetworkMessageRelay.token()).to.equal(erc777Token.address)
        expect(await pNetworkMessageRelay.vault()).to.equal(vault.address)
        expect(await pNetworkMessageRelay.yaho()).to.equal(yaho.address)
      })

      it("Should not permit to add again the same network", async function () {
        const { pNetworkMessageRelay } = await setup()
        await expect(pNetworkMessageRelay.addNetwork("0x11223344")).to.revertedWithCustomError(
          pNetworkMessageRelay,
          "AlreadyExistingNetworkId",
        )
      })
    })

    describe("relayMessages()", function () {
      it("Relays message hashes over pNetwork", async function () {
        const { pNetworkMessageRelay, pNetworkAdapter, vault, erc777Token } = await setup()
        await expect(pNetworkMessageRelay.relayMessages([0, 1], pNetworkAdapter.address))
          .to.emit(pNetworkMessageRelay, "MessageRelayed")
          .withArgs(pNetworkMessageRelay.address, 0)
          .and.to.emit(vault, "PegIn")
          .withArgs(
            erc777Token.address,
            pNetworkMessageRelay.address,
            100,
            pNetworkAdapter.address.replace("0x", "").toLowerCase(),
            "0x000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002fd0a21687761d1abc40ff03c81caca3fed1ee30a97ad6255c84706d3afe9fa2b92b1ce5792dbd6e0d8e27dc9819fee7d061c1836f6d145383057377bc24c9301",
            "0x12345678",
            "0x87654321",
          )
          .and.to.emit(vault, "PegIn")
          .withArgs(
            erc777Token.address,
            pNetworkMessageRelay.address,
            100,
            pNetworkAdapter.address.replace("0x", "").toLowerCase(),
            "0x000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002fd0a21687761d1abc40ff03c81caca3fed1ee30a97ad6255c84706d3afe9fa2b92b1ce5792dbd6e0d8e27dc9819fee7d061c1836f6d145383057377bc24c9301",
            "0x12345678",
            "0x11223344",
          )
      })
    })
  })

  describe("Host Network", () => {
    const setup = async () => {
      await resetNetwork()
      const [wallet] = await ethers.getSigners()
      const Yaho = await ethers.getContractFactory("Yaho")
      const yaho = await Yaho.deploy()
      await deployErc1820Registry(wallet)
      const PToken = await ethers.getContractFactory("PToken")
      const pToken = await PToken.deploy("pToken", "P", [])
      const anotherPToken = await PToken.deploy("Another ERC777 Token", "A777", [])
      const Vault = await ethers.getContractFactory("MockVault")
      const vault = await Vault.deploy()
      await vault.initialize([pToken.address, anotherPToken.address], "0x12345678")
      const PNetworkMessageRelay = await ethers.getContractFactory("PNetworkMessageRelay")
      const pNetworkMessageRelay = await PNetworkMessageRelay.deploy(ZERO_ADDRESS, pToken.address, yaho.address)
      await pNetworkMessageRelay.addNetwork("0x12345678")
      await pNetworkMessageRelay.addNetwork("0x11223344")

      await pToken.connect(wallet).send(pNetworkMessageRelay.address, 10000, "0x")

      const PNetworkAdapter = await ethers.getContractFactory("PNetworkAdapter")
      const pNetworkAdapter = await PNetworkAdapter.deploy(vault.address, pNetworkMessageRelay.address, DOMAIN_ID)
      const PingPong = await ethers.getContractFactory("PingPong")
      const pingPong = await PingPong.deploy()
      const message_1 = {
        to: pingPong.address,
        toChainId: 1,
        data: pingPong.interface.getSighash("ping"),
      }

      await yaho.dispatchMessages([message_1, message_1])

      return {
        pToken,
        anotherPToken,
        vault,
        wallet,
        yaho,
        pNetworkMessageRelay,
        pNetworkAdapter,
      }
    }

    describe("Deploy", function () {
      it("Successfully deploys contract", async function () {
        const { pNetworkMessageRelay, pToken, yaho } = await setup()
        expect(await pNetworkMessageRelay.deployed())
        expect(await pNetworkMessageRelay.token()).to.equal(pToken.address)
        expect(await pNetworkMessageRelay.vault()).to.equal(ZERO_ADDRESS)
        expect(await pNetworkMessageRelay.yaho()).to.equal(yaho.address)
      })

      it("Should not permit to add again the same network", async function () {
        const { pNetworkMessageRelay } = await setup()
        await expect(pNetworkMessageRelay.addNetwork("0x11223344")).to.revertedWithCustomError(
          pNetworkMessageRelay,
          "AlreadyExistingNetworkId",
        )
      })
    })

    describe("relayMessages()", function () {
      it("Relays message hashes over pNetwork", async function () {
        const { pNetworkMessageRelay, pNetworkAdapter, pToken } = await setup()
        await expect(pNetworkMessageRelay.relayMessages([0, 1], pNetworkAdapter.address))
          .to.emit(pNetworkMessageRelay, "MessageRelayed")
          .withArgs(pNetworkMessageRelay.address, 0)
          .and.to.emit(pToken, "Redeem")
          .withArgs(
            pNetworkMessageRelay.address,
            100,
            pNetworkAdapter.address.replace("0x", "").toLowerCase(),
            "0x000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002fd0a21687761d1abc40ff03c81caca3fed1ee30a97ad6255c84706d3afe9fa2b92b1ce5792dbd6e0d8e27dc9819fee7d061c1836f6d145383057377bc24c9301",
            "0x87654321",
            "0x12345678",
          )
          .and.to.emit(pToken, "Redeem")
          .withArgs(
            pNetworkMessageRelay.address,
            100,
            pNetworkAdapter.address.replace("0x", "").toLowerCase(),
            "0x000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002fd0a21687761d1abc40ff03c81caca3fed1ee30a97ad6255c84706d3afe9fa2b92b1ce5792dbd6e0d8e27dc9819fee7d061c1836f6d145383057377bc24c9301",
            "0x87654321",
            "0x11223344",
          )
      })
    })
  })
})
