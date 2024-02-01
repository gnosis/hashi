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
  const MockAdapter = await ethers.getContractFactory("MockAdapter")
  const mockAdapter = await MockAdapter.deploy()
  const badMockAdapter = await MockAdapter.deploy()
  const nonReportingMockAdapter = await MockAdapter.deploy()

  await mockAdapter.setHashes(DOMAIN_ID, [0, 1], [HASH_ZERO, HASH_GOOD])
  await badMockAdapter.setHashes(DOMAIN_ID, [0, 1], [HASH_BAD, HASH_BAD])
  await nonReportingMockAdapter.setHashes(DOMAIN_ID, [0, 1], [HASH_ZERO, HASH_ZERO])

  return {
    wallet,
    hashi,
    mockAdapter,
    badMockAdapter,
    nonReportingMockAdapter,
  }
}

describe("Hashi", function () {
  describe("Deploy", function () {
    it("Successfully deploys contract", async function () {
      const { hashi } = await setup()
      expect(await hashi.deployed())
    })
  })

  describe("getHashFromAdapter()", function () {
    it("Returns correct hash", async function () {
      const { hashi, mockAdapter } = await setup()
      expect(await hashi.getHashFromAdapter(DOMAIN_ID, 0, mockAdapter.address)).to.equal(HASH_ZERO)
      expect(await hashi.getHashFromAdapter(DOMAIN_ID, 1, mockAdapter.address)).to.equal(HASH_GOOD)
    })
  })

  describe("getHashesFromAdapters()", function () {
    it("Reverts if adapters length is zero", async function () {
      const { hashi } = await setup()
      await expect(hashi.getHashesFromAdapters(DOMAIN_ID, 1, [])).to.revertedWithCustomError(hashi, "NoAdaptersGiven")
    })
    it("Returns correct hashs from each adapter", async function () {
      const { hashi, mockAdapter, badMockAdapter } = await setup()
      const adapters = [mockAdapter.address, badMockAdapter.address]
      const returnData = await hashi.getHashesFromAdapters(DOMAIN_ID, 1, adapters)
      expect(returnData[0]).to.equal(HASH_GOOD)
      expect(returnData[1]).to.equal(HASH_BAD)
    })
    it("Returns Bytes(0) for non-reporting adapters", async function () {
      const { hashi, mockAdapter, nonReportingMockAdapter } = await setup()
      const adapters = [mockAdapter.address, nonReportingMockAdapter.address]
      const returnData = await hashi.getHashesFromAdapters(DOMAIN_ID, 1, adapters)
      expect(returnData[0]).to.equal(HASH_GOOD)
      expect(returnData[1]).to.equal(HASH_ZERO)
    })
  })

  describe("getHash()", function () {
    it("Reverts if adapters length is zero", async function () {
      const { hashi } = await setup()
      await expect(hashi.getHash(DOMAIN_ID, 1, [])).to.revertedWithCustomError(hashi, "NoAdaptersGiven")
    })
    it("Reverts if one of adapters is non-reporting", async function () {
      const { hashi, mockAdapter, nonReportingMockAdapter } = await setup()
      await expect(hashi.getHash(DOMAIN_ID, 1, [nonReportingMockAdapter.address])).to.revertedWithCustomError(
        hashi,
        "HashNotAvailableInAdapter",
      )
      await expect(
        hashi.getHash(DOMAIN_ID, 1, [mockAdapter.address, nonReportingMockAdapter.address]),
      ).to.revertedWithCustomError(hashi, "HashNotAvailableInAdapter")
    })
    it("Reverts if adapters disagree", async function () {
      const { hashi, mockAdapter, badMockAdapter } = await setup()
      await expect(
        hashi.getHash(DOMAIN_ID, 1, [mockAdapter.address, badMockAdapter.address]),
      ).to.revertedWithCustomError(hashi, "AdaptersDisagree")
    })
    it("Returns unanimously agreed on hash", async function () {
      const { hashi, mockAdapter } = await setup()
      expect(
        await hashi.getHash(DOMAIN_ID, 1, [mockAdapter.address, mockAdapter.address, mockAdapter.address]),
      ).to.equal(HASH_GOOD)
    })
    it("Returns hash for single adapter", async function () {
      const { hashi, mockAdapter } = await setup()
      expect(await hashi.getHash(DOMAIN_ID, 1, [mockAdapter.address])).to.equal(HASH_GOOD)
    })
  })

  describe("checkHashWithThresholdFromAdapters()", function () {
    it("should return false if the threshold is not reached", async () => {
      const { hashi, mockAdapter, badMockAdapter, nonReportingMockAdapter } = await setup()
      const id = 3
      const threshold = 3
      const adapters = [mockAdapter, badMockAdapter, nonReportingMockAdapter].map(({ address }) => address)
      await mockAdapter.setHashes(DOMAIN_ID, [id], [HASH_GOOD])
      expect(await hashi.checkHashWithThresholdFromAdapters(DOMAIN_ID, id, threshold, adapters)).to.be.eq(false)
    })
    it("should return true if the threshold is reached", async () => {
      const { hashi, mockAdapter, badMockAdapter, nonReportingMockAdapter } = await setup()
      const id = 3
      const threshold = 3
      const adapters = [mockAdapter, badMockAdapter, nonReportingMockAdapter].map(({ address }) => address)
      await mockAdapter.setHashes(DOMAIN_ID, [id], [HASH_GOOD])
      await badMockAdapter.setHashes(DOMAIN_ID, [id], [HASH_GOOD])
      await nonReportingMockAdapter.setHashes(DOMAIN_ID, [id], [HASH_GOOD])
      expect(await hashi.checkHashWithThresholdFromAdapters(DOMAIN_ID, id, threshold, adapters)).to.be.eq(true)
    })
    it("should revert if the threshold > adapters", async () => {
      const { hashi, mockAdapter, badMockAdapter, nonReportingMockAdapter } = await setup()
      const id = 3
      const threshold = 4
      const adapters = [mockAdapter, badMockAdapter, nonReportingMockAdapter].map(({ address }) => address)
      await expect(hashi.checkHashWithThresholdFromAdapters(DOMAIN_ID, id, threshold, adapters))
        .to.be.revertedWithCustomError(hashi, "InvalidThreshold")
        .withArgs(threshold, adapters.length)
    })
    it("should revert false if the threshold is 0", async () => {
      const { hashi, mockAdapter, badMockAdapter, nonReportingMockAdapter } = await setup()
      const id = 3
      const threshold = 0
      const adapters = [mockAdapter, badMockAdapter, nonReportingMockAdapter].map(({ address }) => address)
      await expect(hashi.checkHashWithThresholdFromAdapters(DOMAIN_ID, id, threshold, adapters))
        .to.be.revertedWithCustomError(hashi, "InvalidThreshold")
        .withArgs(threshold, adapters.length)
    })
    it("should revert false if we don't provide any adapter", async () => {
      const { hashi } = await setup()
      const id = 3
      const threshold = 3
      await expect(
        hashi.checkHashWithThresholdFromAdapters(DOMAIN_ID, id, threshold, []),
      ).to.be.revertedWithCustomError(hashi, "NoAdaptersGiven")
    })
  })
})
