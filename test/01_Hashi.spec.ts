import { expect } from "chai"
import { ethers } from "hardhat"

const CHAIN_ID = 1
const HEADER_ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000"
const HEADER_GOOD = "0x0000000000000000000000000000000000000000000000000000000000000001"
const HEADER_BAD = "0x0000000000000000000000000000000000000000000000000000000000000bad"

const setup = async () => {
  const [wallet] = await ethers.getSigners()
  const Hashi = await ethers.getContractFactory("Hashi")
  const hashi = await Hashi.deploy()
  const MockOracleAdapter = await ethers.getContractFactory("MockOracleAdapter")
  const mockOracleAdapter = await MockOracleAdapter.deploy()
  const badMockOracleAdapter = await MockOracleAdapter.deploy()
  const nonReportingMockOracleAdapter = await MockOracleAdapter.deploy()

  await mockOracleAdapter.setBlockHeaders(CHAIN_ID, [0, 1], [HEADER_ZERO, HEADER_GOOD])
  await badMockOracleAdapter.setBlockHeaders(CHAIN_ID, [0, 1], [HEADER_BAD, HEADER_BAD])
  await nonReportingMockOracleAdapter.setBlockHeaders(CHAIN_ID, [0, 1], [HEADER_ZERO, HEADER_ZERO])

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

  describe("getHeaderFromOracle()", function () {
    it("Returns correct block header", async function () {
      const { hashi, mockOracleAdapter } = await setup()
      expect(await hashi.getHeaderFromOracle(mockOracleAdapter.address, CHAIN_ID, 0)).to.equal(HEADER_ZERO)
      expect(await hashi.getHeaderFromOracle(mockOracleAdapter.address, CHAIN_ID, 1)).to.equal(HEADER_GOOD)
    })
  })

  describe("getHeadersFromOracles()", function () {
    it("Reverts if oracleAdapters length is zero", async function () {
      const { hashi } = await setup()
      await expect(hashi.getHeadersFromOracles([], CHAIN_ID, 1)).to.revertedWithCustomError(
        hashi,
        "NoOracleAdaptersGiven",
      )
    })
    it("Returns correct block headers from each oracle", async function () {
      const { hashi, mockOracleAdapter, badMockOracleAdapter } = await setup()
      const oracles = [mockOracleAdapter.address, badMockOracleAdapter.address]
      const returnData = await hashi.getHeadersFromOracles(oracles, CHAIN_ID, 1)
      expect(returnData[0]).to.equal(HEADER_GOOD)
      expect(returnData[1]).to.equal(HEADER_BAD)
    })
    it("Returns Bytes(0) for non-reporting oracles", async function () {
      const { hashi, mockOracleAdapter, nonReportingMockOracleAdapter } = await setup()
      const oracles = [mockOracleAdapter.address, nonReportingMockOracleAdapter.address]
      const returnData = await hashi.getHeadersFromOracles(oracles, CHAIN_ID, 1)
      expect(returnData[0]).to.equal(HEADER_GOOD)
      expect(returnData[1]).to.equal(HEADER_ZERO)
    })
  })

  describe("getUnanimousHeader()", function () {
    it("Reverts if oracleAdapters length is zero", async function () {
      const { hashi, mockOracleAdapter, nonReportingMockOracleAdapter } = await setup()
      await expect(
        hashi.getUnanimousHeader([nonReportingMockOracleAdapter.address], CHAIN_ID, 1),
      ).to.revertedWithCustomError(hashi, "OracleDidNotReport")
      await expect(
        hashi.getUnanimousHeader([mockOracleAdapter.address, nonReportingMockOracleAdapter.address], CHAIN_ID, 1),
      ).to.revertedWithCustomError(hashi, "OracleDidNotReport")
    })
    it("Reverts if oracleAdapters disagree", async function () {
      const { hashi, mockOracleAdapter, badMockOracleAdapter } = await setup()
      await expect(
        hashi.getUnanimousHeader([mockOracleAdapter.address, badMockOracleAdapter.address], CHAIN_ID, 1),
      ).to.revertedWithCustomError(hashi, "OraclesDisagree")
    })
    it("Reverts unanimously agreed on header", async function () {
      const { hashi, mockOracleAdapter } = await setup()
      expect(
        await hashi.getUnanimousHeader(
          [mockOracleAdapter.address, mockOracleAdapter.address, mockOracleAdapter.address],
          CHAIN_ID,
          1,
        ),
      ).to.equal(HEADER_GOOD)
    })
  })
})
