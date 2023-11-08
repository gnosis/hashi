import { expect } from "chai"
import { ethers, network } from "hardhat"

import { toBytes32 } from "../../utils"

const GAS = 10000000
const DOMAIN_ID = "0x0000000000000000000000000000000000000000000000000000000000007a69"
const ID_ONE = toBytes32(1)
const ID_TWO = toBytes32(2)
const HASH_ONE = "0x0000000000000000000000000000000000000000000000000000000000000001"
const HASH_TWO = "0x0000000000000000000000000000000000000000000000000000000000000002"

const setup = async () => {
  await network.provider.request({ method: "hardhat_reset", params: [] })
  const [wallet] = await ethers.getSigners()
  const HeaderStorage = await ethers.getContractFactory("HeaderStorage")
  const headerStorage = await HeaderStorage.deploy()
  const AMB = await ethers.getContractFactory("MockAMB")
  const amb = await AMB.deploy()
  const AMBAdapter = await ethers.getContractFactory("AMBAdapter")
  const ambAdapter = await AMBAdapter.deploy(amb.address, wallet.address, DOMAIN_ID)
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
      expect(await ambAdapter.messageRelay()).to.equal(wallet.address)
      expect(await ambAdapter.chainId()).to.equal(DOMAIN_ID)
    })
  })

  describe("StoreHashes()", function () {
    it("Stores hashes", async function () {
      const { amb, ambAdapter } = await setup()
      const call = await ambAdapter.populateTransaction.storeHashes([ID_ONE, ID_TWO], [HASH_ONE, HASH_TWO])
      await amb.requireToPassMessage(ambAdapter.address, call.data, GAS)
      expect(await ambAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ONE)
      expect(await ambAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_TWO)
    })
    it("Overwrites previous hashes", async function () {
      const { amb, ambAdapter } = await setup()
      let call = await ambAdapter.populateTransaction.storeHashes([ID_ONE, ID_TWO], [HASH_ONE, HASH_TWO])
      await amb.requireToPassMessage(ambAdapter.address, call.data, GAS)
      expect(await ambAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ONE)
      expect(await ambAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_TWO)
      call = await ambAdapter.populateTransaction.storeHashes([ID_TWO, ID_ONE], [HASH_ONE, HASH_TWO])
      await amb.requireToPassMessage(ambAdapter.address, call.data, GAS)
      expect(await ambAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_TWO)
      expect(await ambAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_ONE)
    })
  })

  describe("getHashFromOracle()", function () {
    it("Returns 0 if no header is stored", async function () {
      const { ambAdapter } = await setup()
      expect(await ambAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      )
    })
    it("Returns stored hash", async function () {
      const { amb, ambAdapter } = await setup()
      const call = await ambAdapter.populateTransaction.storeHashes([ID_ONE, ID_TWO], [HASH_ONE, HASH_TWO])
      await amb.requireToPassMessage(ambAdapter.address, call.data, GAS)
      expect(await ambAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ONE)
      expect(await ambAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_TWO)
    })
  })
})
