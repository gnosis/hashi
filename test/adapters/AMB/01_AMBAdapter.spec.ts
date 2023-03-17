import { mine } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers, network } from "hardhat"

const GAS = 1000000
const DOMAIN_ID = "0x0000000000000000000000000000000000000000000000000000000000000064"
const ID = "0x0000000000000000000000000000000000000000000000000000000000000001"
const ANOTHER_ID = "0x0000000000000000000000000000000000000000000000000000000000000002"

const setup = async () => {
  await network.provider.request({ method: "hardhat_reset", params: [] })
  const [wallet] = await ethers.getSigners()
  const HeaderStorage = await ethers.getContractFactory("HeaderStorage")
  const headerStorage = await HeaderStorage.deploy()
  const AMB = await ethers.getContractFactory("MockAMB")
  const amb = await AMB.deploy()
  const AMBAdapter = await ethers.getContractFactory("AMBAdapter")
  const ambAdapter = await AMBAdapter.deploy(amb.address, wallet.address, DOMAIN_ID)
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
      expect(await ambAdapter.reporter()).to.equal(wallet.address)
      expect(await ambAdapter.chainId()).to.equal(DOMAIN_ID)
    })
  })

  describe("StoreHashes()", function () {
    it("Stores hashs", async function () {
      const { amb, ambAdapter } = await setup()
      const call = await ambAdapter.populateTransaction.storeHashes([999, 1000], [ID, ANOTHER_ID])
      await amb.requireToPassMessage(ambAdapter.address, call.data, GAS)
      expect(await ambAdapter.getHashFromOracle(DOMAIN_ID, 999)).to.equal(ID)
      expect(await ambAdapter.getHashFromOracle(DOMAIN_ID, 1000)).to.equal(ANOTHER_ID)
    })
    it("Overwrites previous hashs", async function () {
      const { amb, ambAdapter } = await setup()
      let call = await ambAdapter.populateTransaction.storeHashes([999, 1000], [ID, ANOTHER_ID])
      await amb.requireToPassMessage(ambAdapter.address, call.data, GAS)
      expect(await ambAdapter.getHashFromOracle(DOMAIN_ID, 999)).to.equal(ID)
      expect(await ambAdapter.getHashFromOracle(DOMAIN_ID, 1000)).to.equal(ANOTHER_ID)
      call = await ambAdapter.populateTransaction.storeHashes([1000, 999], [ID, ANOTHER_ID])
      await amb.requireToPassMessage(ambAdapter.address, call.data, GAS)
      expect(await ambAdapter.getHashFromOracle(DOMAIN_ID, 999)).to.equal(ANOTHER_ID)
      expect(await ambAdapter.getHashFromOracle(DOMAIN_ID, 1000)).to.equal(ID)
    })
  })

  describe("getHashFromOracle()", function () {
    it("Returns 0 if no header is stored", async function () {
      const { ambAdapter } = await setup()
      expect(await ambAdapter.getHashFromOracle(DOMAIN_ID, 999)).to.equal(
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      )
    })
    it("Returns stored hash", async function () {
      const { amb, ambAdapter } = await setup()
      const call = await ambAdapter.populateTransaction.storeHashes([999, 1000], [ID, ANOTHER_ID])
      await amb.requireToPassMessage(ambAdapter.address, call.data, GAS)
      expect(await ambAdapter.getHashFromOracle(DOMAIN_ID, 999)).to.equal(ID)
      expect(await ambAdapter.getHashFromOracle(DOMAIN_ID, 1000)).to.equal(ANOTHER_ID)
    })
  })
})
