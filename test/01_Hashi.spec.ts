import { expect } from "chai"
import { ethers } from "hardhat"

const DOMAIN_ID = 1
const HASH_ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000"
const HASH_GOOD = "0x0000000000000000000000000000000000000000000000000000000000000001"
const HASH_BAD = "0x0000000000000000000000000000000000000000000000000000000000000bad"

const setup = async () => {
  const [wallet] = await ethers.getSigners()
  const Hashi = await ethers.getContractFactory("Hashi")
  const hashi = await Hashi.deploy()
  const MockOracleAdapter = await ethers.getContractFactory("MockOracleAdapter")
  const mockOracleAdapter = await MockOracleAdapter.deploy()
  const badMockOracleAdapter = await MockOracleAdapter.deploy()
  const nonReportingMockOracleAdapter = await MockOracleAdapter.deploy()

  await mockOracleAdapter.setHashes(DOMAIN_ID, [0, 1], [HASH_ZERO, HASH_GOOD])
  await badMockOracleAdapter.setHashes(DOMAIN_ID, [0, 1], [HASH_BAD, HASH_BAD])
  await nonReportingMockOracleAdapter.setHashes(DOMAIN_ID, [0, 1], [HASH_ZERO, HASH_ZERO])

  return {
    wallet,
    hashi,
    mockOracleAdapter,
    badMockOracleAdapter,
    nonReportingMockOracleAdapter,
  }
}

describe("Hashi", function () {
  describe("Deploy", function () {
    it("Successfully deploys contract", async function () {
      const { hashi } = await setup()
      expect(await hashi.deployed())
    })
  })

  describe("getHashFromOracle()", function () {
    it("Returns correct hash", async function () {
      const { hashi, mockOracleAdapter } = await setup()
      expect(await hashi.getHashFromOracle(mockOracleAdapter.address, DOMAIN_ID, 0)).to.equal(HASH_ZERO)
      expect(await hashi.getHashFromOracle(mockOracleAdapter.address, DOMAIN_ID, 1)).to.equal(HASH_GOOD)
    })
  })

  describe("getHashesFromOracles()", function () {
    it("Reverts if oracleAdapters length is zero", async function () {
      const { hashi } = await setup()
      await expect(hashi.getHashesFromOracles([], DOMAIN_ID, 1)).to.revertedWithCustomError(
        hashi,
        "NoOracleAdaptersGiven",
      )
    })
    it("Returns correct hashs from each oracle", async function () {
      const { hashi, mockOracleAdapter, badMockOracleAdapter } = await setup()
      const oracles = [mockOracleAdapter.address, badMockOracleAdapter.address]
      const returnData = await hashi.getHashesFromOracles(oracles, DOMAIN_ID, 1)
      expect(returnData[0]).to.equal(HASH_GOOD)
      expect(returnData[1]).to.equal(HASH_BAD)
    })
    it("Returns Bytes(0) for non-reporting oracles", async function () {
      const { hashi, mockOracleAdapter, nonReportingMockOracleAdapter } = await setup()
      const oracles = [mockOracleAdapter.address, nonReportingMockOracleAdapter.address]
      const returnData = await hashi.getHashesFromOracles(oracles, DOMAIN_ID, 1)
      expect(returnData[0]).to.equal(HASH_GOOD)
      expect(returnData[1]).to.equal(HASH_ZERO)
    })
  })

  describe("getHash()", function () {
    it("Reverts if oracleAdapters length is zero", async function () {
      const { hashi } = await setup()
      await expect(hashi.getUnanimousHash([], DOMAIN_ID, 1)).to.revertedWithCustomError(hashi, "NoOracleAdaptersGiven")
    })
    it("Reverts if one of oracleAdapters is non-reporting", async function () {
      const { hashi, mockOracleAdapter, nonReportingMockOracleAdapter } = await setup()
      await expect(hashi.getHash(DOMAIN_ID, 1, [nonReportingMockOracleAdapter.address])).to.revertedWithCustomError(
        hashi,
        "OracleDidNotReport",
      )
      await expect(
        hashi.getHash(DOMAIN_ID, 1, [mockOracleAdapter.address, nonReportingMockOracleAdapter.address]),
      ).to.revertedWithCustomError(hashi, "OracleDidNotReport")
    })
    it("Reverts if oracleAdapters disagree", async function () {
      const { hashi, mockOracleAdapter, badMockOracleAdapter } = await setup()
      await expect(
        hashi.getHash(DOMAIN_ID, 1, [mockOracleAdapter.address, badMockOracleAdapter.address]),
      ).to.revertedWithCustomError(hashi, "OraclesDisagree")
    })
    it("Returns unanimously agreed on hash", async function () {
      const { hashi, mockOracleAdapter } = await setup()
      expect(
        await hashi.getHash(DOMAIN_ID, 1, [
          mockOracleAdapter.address,
          mockOracleAdapter.address,
          mockOracleAdapter.address,
        ]),
      ).to.equal(HASH_GOOD)
    })
    it("Returns hash for single oracle", async function () {
      const { hashi, mockOracleAdapter } = await setup()
      expect(await hashi.getHash(DOMAIN_ID, 1, [mockOracleAdapter.address])).to.equal(HASH_GOOD)
    })
  })
})
