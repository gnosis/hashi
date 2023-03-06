import { mine } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers, network } from "hardhat"

const GAS = 1000000
const CHAIN_ID = "0x0000000000000000000000000000000000000000000000000000000000000064"

const setup = async () => {
  await network.provider.request({ method: "hardhat_reset", params: [] })
  const [wallet] = await ethers.getSigners()
  const HeaderStorage = await ethers.getContractFactory("HeaderStorage")
  const headerStorage = await HeaderStorage.deploy()
  const AMB = await ethers.getContractFactory("MockAMB")
  const amb = await AMB.deploy()
  const AMBHeaderReporter = await ethers.getContractFactory("AMBHeaderReporter")
  const ambHeaderReporter = await AMBHeaderReporter.deploy(amb.address, headerStorage.address)
  const AMBAdapter = await ethers.getContractFactory("AMBAdapter")
  const ambAdapter = await AMBAdapter.deploy(amb.address, ambHeaderReporter.address, CHAIN_ID)
  await mine(1000)
  return {
    wallet,
    headerStorage,
    ambHeaderReporter,
    ambAdapter,
  }
}

describe("AMBHeaderReporter", function () {
  describe("Deploy", function () {
    it("Successfully deploys contract", async function () {
      const { ambHeaderReporter } = await setup()
      expect(await ambHeaderReporter.deployed())
    })
  })

  describe("reportHeader()", function () {
    it("Reports header to AMB", async function () {
      const { ambHeaderReporter, ambAdapter } = await setup()
      const block = await ethers.provider._getBlock(999)
      await expect(ambHeaderReporter.reportHeader(999, ambAdapter.address, GAS))
        .to.emit(ambHeaderReporter, "HeaderReported")
        .withArgs(ambHeaderReporter.address, 999, block.hash)
      expect(await ambAdapter.getHeaderFromOracle(CHAIN_ID, 999)).to.equal(block.hash)
    })
    it("Emits HeaderReported event", async function () {
      const { ambHeaderReporter, ambAdapter } = await setup()
      const block = await ethers.provider._getBlock(999)
      await expect(ambHeaderReporter.reportHeader(999, ambAdapter.address, GAS))
        .to.emit(ambHeaderReporter, "HeaderReported")
        .withArgs(ambHeaderReporter.address, 999, block.hash)
    })
    it("Returns receipt", async function () {
      const { ambHeaderReporter, ambAdapter } = await setup()
      const receipt = await ambHeaderReporter.callStatic.reportHeader(999, ambAdapter.address, GAS)
      expect(receipt).is.not.null
    })
  })

  describe("reportHeaders()", function () {
    it("Reports headers to AMB", async function () {
      const { ambHeaderReporter, ambAdapter } = await setup()
      const block = await ethers.provider._getBlock(999)
      const block2 = await ethers.provider._getBlock(998)
      await expect(ambHeaderReporter.reportHeaders([999, 998], ambAdapter.address, GAS))
        .to.emit(ambHeaderReporter, "HeaderReported")
        .withArgs(ambHeaderReporter.address, 999, block.hash)
      expect(await ambAdapter.getHeaderFromOracle(CHAIN_ID, 999)).to.equal(block.hash)
      expect(await ambAdapter.getHeaderFromOracle(CHAIN_ID, 998)).to.equal(block2.hash)
    })
    it("Reports headers to AMB", async function () {
      const { ambHeaderReporter, ambAdapter } = await setup()
      const block = await ethers.provider._getBlock(999)
      const block2 = await ethers.provider._getBlock(998)
      const receipt = await ambHeaderReporter.reportHeaders([999, 998], ambAdapter.address, GAS)
      await expect(receipt)
        .to.emit(ambHeaderReporter, "HeaderReported")
        .withArgs(ambHeaderReporter.address, 999, block.hash)
      await expect(receipt)
        .to.emit(ambHeaderReporter, "HeaderReported")
        .withArgs(ambHeaderReporter.address, 998, block2.hash)
    })
    it("Returns receipt", async function () {
      const { ambHeaderReporter, ambAdapter } = await setup()
      const receipt = await ambHeaderReporter.callStatic.reportHeader(999, ambAdapter.address, GAS)
      expect(receipt).is.not.null
    })
  })
})
