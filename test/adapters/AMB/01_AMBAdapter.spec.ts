import { mine } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers, network } from "hardhat"

const GAS = 1000000
const CHAIN_ID = "0x0000000000000000000000000000000000000000000000000000000000000064"
const BLOCK_HEADER = "0x0000000000000000000000000000000000000000000000000000000000000001"
const ANOTHER_BLOCK_HEADER = "0x0000000000000000000000000000000000000000000000000000000000000002"

const setup = async () => {
  await network.provider.request({ method: "hardhat_reset", params: [] })
  const [wallet] = await ethers.getSigners()
  const HeaderStorage = await ethers.getContractFactory("HeaderStorage")
  const headerStorage = await HeaderStorage.deploy()
  const AMB = await ethers.getContractFactory("MockAMB")
  const amb = await AMB.deploy()
  const AMBAdapter = await ethers.getContractFactory("AMBAdapter")
  const ambAdapter = await AMBAdapter.deploy(amb.address, wallet.address, CHAIN_ID)
  await mine(1000)
  return {
    wallet,
    amb,
    headerStorage,
    ambAdapter,
  }
}

describe("AMBAdapter", function () {
  describe("Constructor", function () {
    it("Successfully deploys contract with correct state", async function () {
      const { amb, ambAdapter, wallet } = await setup()
      expect(await ambAdapter.deployed())
      expect(await ambAdapter.amb()).to.equal(amb.address)
      expect(await ambAdapter.headerReporter()).to.equal(wallet.address)
      expect(await ambAdapter.chainId()).to.equal(CHAIN_ID)
    })
  })

  describe("StoreBlockHeader()", function () {
    it("Stores block header", async function () {
      const { amb, ambAdapter } = await setup()
      const call = await ambAdapter.populateTransaction.storeBlockHeader(999, BLOCK_HEADER)
      await amb.requireToPassMessage(ambAdapter.address, call.data, GAS)
      expect(await ambAdapter.getHeaderFromOracle(CHAIN_ID, 999)).to.equal(BLOCK_HEADER)
    })
    it("Overwrites previous block header", async function () {
      const { amb, ambAdapter } = await setup()
      let call = await ambAdapter.populateTransaction.storeBlockHeader(999, BLOCK_HEADER)
      await amb.requireToPassMessage(ambAdapter.address, call.data, GAS)
      expect(await ambAdapter.getHeaderFromOracle(CHAIN_ID, 999)).to.equal(BLOCK_HEADER)
      call = await ambAdapter.populateTransaction.storeBlockHeader(999, ANOTHER_BLOCK_HEADER)
      await amb.requireToPassMessage(ambAdapter.address, call.data, GAS)
      expect(await ambAdapter.getHeaderFromOracle(CHAIN_ID, 999)).to.equal(ANOTHER_BLOCK_HEADER)
    })
  })

  describe("StoreBlockHeaders()", function () {
    it("Stores block headers", async function () {
      const { amb, ambAdapter } = await setup()
      const call = await ambAdapter.populateTransaction.storeBlockHeaders(
        [999, 1000],
        [BLOCK_HEADER, ANOTHER_BLOCK_HEADER],
      )
      await amb.requireToPassMessage(ambAdapter.address, call.data, GAS)
      expect(await ambAdapter.getHeaderFromOracle(CHAIN_ID, 999)).to.equal(BLOCK_HEADER)
      expect(await ambAdapter.getHeaderFromOracle(CHAIN_ID, 1000)).to.equal(ANOTHER_BLOCK_HEADER)
    })
    it("Overwrites previous block headers", async function () {
      const { amb, ambAdapter } = await setup()
      let call = await ambAdapter.populateTransaction.storeBlockHeaders(
        [999, 1000],
        [BLOCK_HEADER, ANOTHER_BLOCK_HEADER],
      )
      await amb.requireToPassMessage(ambAdapter.address, call.data, GAS)
      expect(await ambAdapter.getHeaderFromOracle(CHAIN_ID, 999)).to.equal(BLOCK_HEADER)
      expect(await ambAdapter.getHeaderFromOracle(CHAIN_ID, 1000)).to.equal(ANOTHER_BLOCK_HEADER)
      call = await ambAdapter.populateTransaction.storeBlockHeaders([1000, 999], [BLOCK_HEADER, ANOTHER_BLOCK_HEADER])
      await amb.requireToPassMessage(ambAdapter.address, call.data, GAS)
      expect(await ambAdapter.getHeaderFromOracle(CHAIN_ID, 999)).to.equal(ANOTHER_BLOCK_HEADER)
      expect(await ambAdapter.getHeaderFromOracle(CHAIN_ID, 1000)).to.equal(BLOCK_HEADER)
    })
  })

  describe("getHeaderFromOracle()", function () {
    it("Returns 0 if no header is stored", async function () {
      const { ambAdapter } = await setup()
      expect(await ambAdapter.getHeaderFromOracle(CHAIN_ID, 999)).to.equal(
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      )
    })
    it("Returns stored block header", async function () {
      const { amb, ambAdapter } = await setup()
      const call = await ambAdapter.populateTransaction.storeBlockHeaders(
        [999, 1000],
        [BLOCK_HEADER, ANOTHER_BLOCK_HEADER],
      )
      await amb.requireToPassMessage(ambAdapter.address, call.data, GAS)
      expect(await ambAdapter.getHeaderFromOracle(CHAIN_ID, 999)).to.equal(BLOCK_HEADER)
      expect(await ambAdapter.getHeaderFromOracle(CHAIN_ID, 1000)).to.equal(ANOTHER_BLOCK_HEADER)
    })
  })
})
