import { expect } from "chai"
import { ethers, network } from "hardhat"

const CHAIN_ID = 1
const BLOCK_NUMBER_ONE = 123
const BLOCK_NUMBER_TWO = 456
const BLOCK_NUMBER_THREE = 789
const abiCoder = ethers.utils.defaultAbiCoder
const keccak256 = ethers.utils.keccak256
// Encoding data for the oracle according to tellor specs (see: https://github.com/tellor-io/dataSpecs)
let params = abiCoder.encode(["uint256", "uint256"], [CHAIN_ID, BLOCK_NUMBER_ONE])
let queryData = abiCoder.encode(["string", "bytes"], ["EVMHeader", params])
let queryId = keccak256(queryData)
const HASH_VALUE_ONE = "0x0000000000000000000000000000000000000000000000000000000000000001"
const HASH_VALUE_TWO = "0x0000000000000000000000000000000000000000000000000000000000000002"
const HASH_VALUE_THREE = "0x0000000000000000000000000000000000000000000000000000000000000003"

const setup = async () => {
  await network.provider.request({ method: "hardhat_reset", params: [] })
  const playground = await ethers.getContractFactory("TellorPlayground")
  const tellorPlayground = await playground.deploy()
  const TELLORAdapter = await ethers.getContractFactory("TellorAdapter")
  const tellorAdapter = await TELLORAdapter.deploy(tellorPlayground.address)
  return {
    tellorPlayground,
    tellorAdapter,
  }
}

const advanceTimeByMinutes = async (minutes: number) => {
  // Get the current block
  const currentBlock = await ethers.provider.getBlock("latest")
  // Calculate the time for the next block
  const nextBlockTime = currentBlock.timestamp + minutes * 60 // increase by n minutes
  // Advance time by sending a request directly to the node
  await ethers.provider.send("evm_setNextBlockTimestamp", [nextBlockTime])
  // Mine the next block for the time change to take effect
  await ethers.provider.send("evm_mine", [])
}

describe("TELLORAdapter", () => {
  describe("Constructor", () => {
    it("Successfully deploy contract", async () => {
      const { tellorPlayground, tellorAdapter } = await setup()
      expect(await tellorAdapter.deployed())
      expect(await tellorAdapter.tellor()).to.equal(tellorPlayground.address)
    })
  })

  describe("StoreHash()", () => {
    it("Stores hash", async () => {
      const { tellorPlayground, tellorAdapter } = await setup()
      // submit value to tellor oracle
      await tellorPlayground.submitValue(queryId, HASH_VALUE_ONE, 0, queryData)
      // fails if 15 minutes have not passed
      await expect(tellorAdapter.storeHash(CHAIN_ID, BLOCK_NUMBER_ONE)).to.revertedWithCustomError(
        tellorAdapter,
        "BlockHashNotAvailable",
      )
      // advance time by 15 minutes to bypass security delay
      await advanceTimeByMinutes(15)
      // store hash
      await tellorAdapter.storeHash(CHAIN_ID, BLOCK_NUMBER_ONE)
      expect(await tellorAdapter.getHashFromOracle(CHAIN_ID, BLOCK_NUMBER_ONE)).to.equal(HASH_VALUE_ONE)
    })
  })

  describe("StoreHashes()", () => {
    it("Stores multiple hashes", async () => {
      const { tellorPlayground, tellorAdapter } = await setup()
      // submit value to tellor oracle
      params = abiCoder.encode(["uint256", "uint256[]"], [CHAIN_ID, [BLOCK_NUMBER_ONE, BLOCK_NUMBER_TWO, BLOCK_NUMBER_THREE]])
      queryData = abiCoder.encode(["string", "bytes"], ["EVMHeaderslist", params])
      queryId = keccak256(queryData)
      let value = abiCoder.encode(["bytes32[]"], [[HASH_VALUE_ONE, HASH_VALUE_TWO, HASH_VALUE_THREE]])
      // tellor staked reporter submits value to tellor oracle
      await tellorPlayground.submitValue(queryId, value, 0, queryData)
      // requesting and storing hashes fails if 15 minutes have not passed since submission (security delay)
      await expect(tellorAdapter.storeHashes(CHAIN_ID, [BLOCK_NUMBER_ONE, BLOCK_NUMBER_TWO, BLOCK_NUMBER_THREE])).to.revertedWithCustomError(
        tellorAdapter,
        "BlockHashNotAvailable",
      )
      // advance time by 15 minutes to bypass security delay
      await advanceTimeByMinutes(15)
      // store hash
      await tellorAdapter.storeHashes(CHAIN_ID, [BLOCK_NUMBER_ONE, BLOCK_NUMBER_TWO, BLOCK_NUMBER_THREE])
      expect(await tellorAdapter.getHashFromOracle(CHAIN_ID, BLOCK_NUMBER_ONE)).to.equal(HASH_VALUE_ONE)
      expect(await tellorAdapter.getHashFromOracle(CHAIN_ID, BLOCK_NUMBER_TWO)).to.equal(HASH_VALUE_TWO)
      expect(await tellorAdapter.getHashFromOracle(CHAIN_ID, BLOCK_NUMBER_THREE)).to.equal(HASH_VALUE_THREE)
    })
  })

  describe("getHashFromOracle()", () => {
    it("Returns 0 if no header is stored", async () => {
      const { tellorAdapter } = await setup()
      expect(await tellorAdapter.getHashFromOracle(CHAIN_ID, BLOCK_NUMBER_ONE)).to.equal(
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      )
    })
  })
})
