import { expect } from "chai"
import { ethers } from "hardhat"

import { ZERO_ADDRESS, deployErc1820Registry, resetNetwork } from "./utils.spec"

const DOMAIN_ID = "0x0000000000000000000000000000000000000000000000000000000000001"

describe("PNetworkHeaderReporter", function () {
  describe("Native Network", () => {
    const setup = async () => {
      await resetNetwork()
      const [wallet] = await ethers.getSigners()
      const HeaderStorage = await ethers.getContractFactory("HeaderStorage")
      const headerStorage = await HeaderStorage.deploy()
      await deployErc1820Registry(wallet)
      const ERC777Token = await ethers.getContractFactory("ERC777Token")
      const erc777Token = await ERC777Token.deploy("ERC777 Token", "E777", [])
      const anotherErc777Token = await ERC777Token.deploy("Another ERC777 Token", "A777", [])
      const Vault = await ethers.getContractFactory("MockVault")
      const vault = await Vault.deploy()
      await vault.initialize([erc777Token.address, anotherErc777Token.address], "0x12345678")

      const PNetworkHeaderReporter = await ethers.getContractFactory("PNetworkHeaderReporter")
      const pNetworkHeaderReporter = await PNetworkHeaderReporter.deploy(
        headerStorage.address,
        DOMAIN_ID,
        vault.address,
        erc777Token.address,
        "0x005fe7f9",
      )

      await erc777Token.connect(wallet).send(pNetworkHeaderReporter.address, 10000, "0x")

      const PNetworkAdapter = await ethers.getContractFactory("PNetworkAdapter")
      const pNetworkAdapter = await PNetworkAdapter.deploy(
        DOMAIN_ID,
        pNetworkHeaderReporter.address,
        vault.address,
        pNetworkHeaderReporter.address,
        "0x005fe7f9",
      )

      return {
        erc777Token,
        anotherErc777Token,
        vault,
        wallet,
        headerStorage,
        pNetworkHeaderReporter,
        pNetworkAdapter,
      }
    }

    describe("Deploy", function () {
      it("Successfully deploys contract", async function () {
        const { pNetworkHeaderReporter, erc777Token, vault, headerStorage } = await setup()
        expect(await pNetworkHeaderReporter.deployed())
        expect(await pNetworkHeaderReporter.TOKEN()).to.equal(erc777Token.address)
        expect(await pNetworkHeaderReporter.VAULT()).to.equal(vault.address)
        expect(await pNetworkHeaderReporter.HEADER_STORAGE()).to.equal(headerStorage.address)
      })
    })

    describe("reportHeaders()", function () {
      it("Reports headers over pNetwork", async function () {
        const { pNetworkHeaderReporter, pNetworkAdapter, vault, erc777Token, headerStorage } = await setup()
        const blockIds = [0, 1]
        const blocks = await Promise.all(blockIds.map((_id) => ethers.provider._getBlock(_id)))
        const hashes = blocks.map((_block) => _block.hash)
        const expectedUserData = new ethers.utils.AbiCoder().encode(["uint256[]", "bytes32[]"], [blockIds, hashes])
        await expect(pNetworkHeaderReporter.reportHeaders(blockIds, pNetworkAdapter.address))
          .to.emit(pNetworkHeaderReporter, "HeaderReported")
          .withArgs(pNetworkHeaderReporter.address, blockIds[0], hashes[0])
          .and.to.emit(pNetworkHeaderReporter, "HeaderReported")
          .withArgs(pNetworkHeaderReporter.address, blockIds[1], hashes[1])
          .and.to.emit(vault, "PegIn")
          .withArgs(
            erc777Token.address,
            pNetworkHeaderReporter.address,
            1,
            pNetworkAdapter.address.replace("0x", "").toLowerCase(),
            expectedUserData,
            "0x12345678",
            "0x005fe7f9",
          )
        expect(await headerStorage.headers(blockIds[0])).to.equal(hashes[0])
        expect(await headerStorage.headers(blockIds[1])).to.equal(hashes[1])
      })
    })
  })

  describe("Host Network", () => {
    const setup = async () => {
      await resetNetwork()
      const [wallet] = await ethers.getSigners()
      const HeaderStorage = await ethers.getContractFactory("HeaderStorage")
      const headerStorage = await HeaderStorage.deploy()
      await deployErc1820Registry(wallet)
      const PToken = await ethers.getContractFactory("PToken")
      const pToken = await PToken.deploy("pToken", "P", [])
      const anotherPToken = await PToken.deploy("Another ERC777 Token", "A777", [])
      const Vault = await ethers.getContractFactory("MockVault")
      const vault = await Vault.deploy()
      await vault.initialize([pToken.address, anotherPToken.address], "0x12345678")

      const PNetworkHeaderReporter = await ethers.getContractFactory("PNetworkHeaderReporter")
      const pNetworkHeaderReporter = await PNetworkHeaderReporter.deploy(
        headerStorage.address,
        DOMAIN_ID,
        ZERO_ADDRESS,
        pToken.address,
        "0x005fe7f9",
      )

      await pToken.connect(wallet).send(pNetworkHeaderReporter.address, 10000, "0x")

      const PNetworkAdapter = await ethers.getContractFactory("PNetworkAdapter")
      const pNetworkAdapter = await PNetworkAdapter.deploy(
        DOMAIN_ID,
        pNetworkHeaderReporter.address,
        vault.address,
        pNetworkHeaderReporter.address,
        "0x005fe7f9",
      )

      return {
        pToken,
        anotherPToken,
        vault,
        wallet,
        headerStorage,
        pNetworkHeaderReporter,
        pNetworkAdapter,
      }
    }

    describe("Deploy", function () {
      it("Successfully deploys contract", async function () {
        const { pNetworkHeaderReporter, pToken, headerStorage } = await setup()
        expect(await pNetworkHeaderReporter.deployed())
        expect(await pNetworkHeaderReporter.TOKEN()).to.equal(pToken.address)
        expect(await pNetworkHeaderReporter.VAULT()).to.equal(ZERO_ADDRESS)
        expect(await pNetworkHeaderReporter.HEADER_STORAGE()).to.equal(headerStorage.address)
      })
    })

    describe("reportHeaders()", function () {
      it("Reports headers over pNetwork", async function () {
        const { pNetworkHeaderReporter, pNetworkAdapter, pToken, headerStorage } = await setup()
        const blockIds = [0, 1]
        const blocks = await Promise.all(blockIds.map((_id) => ethers.provider._getBlock(_id)))
        const hashes = blocks.map((_block) => _block.hash)
        const expectedUserData = new ethers.utils.AbiCoder().encode(["uint256[]", "bytes32[]"], [blockIds, hashes])
        await expect(pNetworkHeaderReporter.reportHeaders(blockIds, pNetworkAdapter.address))
          .to.emit(pNetworkHeaderReporter, "HeaderReported")
          .withArgs(pNetworkHeaderReporter.address, blockIds[0], hashes[0])
          .and.to.emit(pNetworkHeaderReporter, "HeaderReported")
          .withArgs(pNetworkHeaderReporter.address, blockIds[1], hashes[1])
          .and.to.emit(pToken, "Redeem")
          .withArgs(
            pNetworkHeaderReporter.address,
            1,
            pNetworkAdapter.address.replace("0x", "").toLowerCase(),
            expectedUserData,
            "0x87654321",
            "0x005fe7f9",
          )
        expect(await headerStorage.headers(blockIds[0])).to.equal(hashes[0])
        expect(await headerStorage.headers(blockIds[1])).to.equal(hashes[1])
      })
    })
  })
})
