/*import { mine } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers, network } from "hardhat"

const setup = async () => {
  await network.provider.request({ method: "hardhat_reset", params: [] })
  const [wallet] = await ethers.getSigners()
  const HeaderStorage = await ethers.getContractFactory("HeaderStorage")
  const headerStorage = await HeaderStorage.deploy()
  await mine(1000)
  return {
    wallet,
    headerStorage,
  }
}

describe("HeaderStorage", function () {
  describe("Deploy", function () {
    it("Successfully deploys contract", async function () {
      const { headerStorage } = await setup()
      expect(await headerStorage.deployed())
    })
  })

  describe("storeBlockHeader()", function () {
    it("Reverts if block is out of range", async function () {
      const { headerStorage } = await setup()
      await expect(headerStorage.storeBlockHeader(500)).to.be.revertedWithCustomError(headerStorage, "HeaderOutOfRange")
    })
    it("Stores and returns block header", async function () {
      const { headerStorage } = await setup()
      const block = await ethers.provider._getBlock(999)
      const result = await headerStorage.callStatic.storeBlockHeader(999)
      expect(result).to.equal(block.hash)
      await headerStorage.storeBlockHeader(999)
      expect(await headerStorage.headers(999)).to.equal(block.hash)
    })
    it("Returns block header if previously set", async function () {
      const { headerStorage } = await setup()
      const block = await ethers.provider._getBlock(999)
      const result = await headerStorage.callStatic.storeBlockHeader(999)
      await headerStorage.storeBlockHeader(999)
      expect(result).to.equal(block.hash)
    })
    it("Emits HeaderStored event", async function () {
      const { headerStorage } = await setup()
      const block = await ethers.provider._getBlock(999)
      await expect(headerStorage.storeBlockHeader(999)).to.emit(headerStorage, "HeaderStored").withArgs(999, block.hash)
    })
  })

  describe("storeBlockHeaders()", function () {
    it("Stores and returns block headers", async function () {
      const { headerStorage } = await setup()
      const block999 = await ethers.provider._getBlock(999)
      const block998 = await ethers.provider._getBlock(998)
      const blockHeaders = [block999.hash, block998.hash]
      const result = await headerStorage.callStatic.storeBlockHeaders([999, 998])
      expect(result[0]).to.equal(blockHeaders[0])
      expect(result[1]).to.equal(blockHeaders[1])
    })
  })
})*/
