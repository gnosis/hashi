import { expect } from "chai"
import { ethers, network } from "hardhat"

import { ZERO_ADDRESS, deployErc1820Registry, resetNetwork } from "./utils.spec"

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
      const pNetworkAdapter = await PNetworkAdapter.deploy(vault.address, pNetworkMessageRelay.address)
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
        const { pNetworkMessageRelay, pNetworkAdapter, vault, erc777Token, yaho } = await setup()
        const ids = [0, 1]
        const hashes = await Promise.all(ids.map(async (_id) => await yaho.hashes(_id)))
        const expectedUserData = new ethers.utils.AbiCoder().encode(
          ["uint256[]", "bytes32[]", "uint256"],
          [ids, hashes, network.config.chainId],
        )
        await expect(pNetworkMessageRelay.relayMessages(ids, pNetworkAdapter.address))
          .to.emit(pNetworkMessageRelay, "MessageRelayed")
          .withArgs(pNetworkMessageRelay.address, 0)
          .and.to.emit(vault, "PegIn")
          .withArgs(
            erc777Token.address,
            pNetworkMessageRelay.address,
            100,
            pNetworkAdapter.address.replace("0x", "").toLowerCase(),
            expectedUserData,
            "0x12345678",
            "0x87654321",
          )
          .and.to.emit(vault, "PegIn")
          .withArgs(
            erc777Token.address,
            pNetworkMessageRelay.address,
            100,
            pNetworkAdapter.address.replace("0x", "").toLowerCase(),
            expectedUserData,
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
      const pNetworkAdapter = await PNetworkAdapter.deploy(vault.address, pNetworkMessageRelay.address)
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
        const { pNetworkMessageRelay, pNetworkAdapter, pToken, yaho } = await setup()
        const ids = [0, 1]
        const hashes = await Promise.all(ids.map(async (_id) => await yaho.hashes(_id)))
        const expectedUserData = new ethers.utils.AbiCoder().encode(
          ["uint256[]", "bytes32[]", "uint256"],
          [ids, hashes, network.config.chainId],
        )
        await expect(pNetworkMessageRelay.relayMessages(ids, pNetworkAdapter.address))
          .to.emit(pNetworkMessageRelay, "MessageRelayed")
          .withArgs(pNetworkMessageRelay.address, 0)
          .and.to.emit(pToken, "Redeem")
          .withArgs(
            pNetworkMessageRelay.address,
            100,
            pNetworkAdapter.address.replace("0x", "").toLowerCase(),
            expectedUserData,
            "0x87654321",
            "0x12345678",
          )
          .and.to.emit(pToken, "Redeem")
          .withArgs(
            pNetworkMessageRelay.address,
            100,
            pNetworkAdapter.address.replace("0x", "").toLowerCase(),
            expectedUserData,
            "0x87654321",
            "0x11223344",
          )
      })
    })
  })
})
