/*import { expect } from "chai"
import { ethers, network } from "hardhat"

import { toBytes32 } from "../../utils"

const DOMAIN_ID = 5
const ID1 = toBytes32(1)
const ID2 = toBytes32(2)
const HASH1 = "0x0000000000000000000000000000000000000000000000000000000000000001"
const HASH2 = "0x0000000000000000000000000000000000000000000000000000000000000002"

const setup = async () => {
  await network.provider.request({ method: "hardhat_reset", params: [] })
  const signers = await ethers.getSigners()
  const admin = signers[0]
  const reporter = signers[1]
  const handler = signers[2]
  const otherAddress = signers[3]
  const SygmaAdapter = await ethers.getContractFactory("SygmaAdapter")
  const sygmaAdapter = await SygmaAdapter.deploy(handler.address)
  return {
    admin,
    reporter,
    handler,
    otherAddress,
    sygmaAdapter,
  }
}

describe("SygmaAdapter", function () {
  describe("Constructor", function () {
    it("Successfully deploys contract with correct state", async function () {
      const { handler, sygmaAdapter } = await setup()
      expect(await sygmaAdapter.deployed())
      expect(await sygmaAdapter._handler()).to.equal(handler.address)
    })
  })

  describe("setReporter()", function () {
    it("Enables the reporter and sets its chainID", async function () {
      const { reporter, sygmaAdapter } = await setup()
      expect(await sygmaAdapter.deployed())
      await expect(sygmaAdapter.setReporter(reporter.address, DOMAIN_ID, true))
        .to.emit(sygmaAdapter, "ReporterSet")
        .withArgs(reporter.address, DOMAIN_ID, true)
      const result = await sygmaAdapter.reporters(reporter.address)
      expect(result[0].toNumber()).to.equal(DOMAIN_ID)
      expect(result[1]).to.equal(true)
    })

    it("Disables the reporter", async function () {
      const { reporter, sygmaAdapter } = await setup()
      expect(await sygmaAdapter.deployed())
      await expect(sygmaAdapter.setReporter(reporter.address, DOMAIN_ID, true))
        .to.emit(sygmaAdapter, "ReporterSet")
        .withArgs(reporter.address, DOMAIN_ID, true)
      let result = await sygmaAdapter.reporters(reporter.address)
      expect(result[1]).to.equal(true)
      await expect(sygmaAdapter.setReporter(reporter.address, DOMAIN_ID, false))
        .to.emit(sygmaAdapter, "ReporterSet")
        .withArgs(reporter.address, DOMAIN_ID, false)
      result = await sygmaAdapter.reporters(reporter.address)
      expect(result[1]).to.equal(false)
    })

    it("Doesn't set the reporter if the sender is unauthorized", async function () {
      const { reporter, sygmaAdapter, otherAddress } = await setup()
      expect(await sygmaAdapter.deployed())
      await expect(
        sygmaAdapter.connect(otherAddress).setReporter(reporter.address, DOMAIN_ID, true),
      ).to.be.revertedWithCustomError(sygmaAdapter, "Unauthorized")
    })
  })

  describe("StoreHashes()", function () {
    it("Stores hashes", async function () {
      const { handler, reporter, sygmaAdapter } = await setup()
      await expect(sygmaAdapter.setReporter(reporter.address, DOMAIN_ID, true))
        .to.emit(sygmaAdapter, "ReporterSet")
        .withArgs(reporter.address, DOMAIN_ID, true)
      await expect(sygmaAdapter.connect(handler).storeHashes(reporter.address, [ID1, ID2], [HASH1, HASH2]))
        .to.emit(sygmaAdapter, "HashStored")
        .withArgs(ID1, HASH1)
        .and.to.emit(sygmaAdapter, "HashStored")
        .withArgs(ID2, HASH2)
      expect(await sygmaAdapter.getHashFromOracle(DOMAIN_ID, ID1)).to.equal(HASH1)
    })

    it("Reverts if array lengths mismatch", async function () {
      const { handler, reporter, sygmaAdapter } = await setup()
      await expect(sygmaAdapter.setReporter(reporter.address, DOMAIN_ID, true))
        .to.emit(sygmaAdapter, "ReporterSet")
        .withArgs(reporter.address, DOMAIN_ID, true)
      await expect(
        sygmaAdapter.connect(handler).storeHashes(reporter.address, [ID1, ID2], [HASH1]),
      ).to.be.revertedWithCustomError(sygmaAdapter, "ArrayLengthMismatch")
    })

    it("Reverts if sender is not the authorized handler", async function () {
      const { otherAddress, reporter, sygmaAdapter } = await setup()
      await expect(sygmaAdapter.setReporter(reporter.address, DOMAIN_ID, true))
        .to.emit(sygmaAdapter, "ReporterSet")
        .withArgs(reporter.address, DOMAIN_ID, true)
      await expect(
        sygmaAdapter.connect(otherAddress).storeHashes(reporter.address, [ID1, ID2], [HASH1, HASH2]),
      )
        .to.be.revertedWithCustomError(sygmaAdapter, "InvalidHandler")
        .withArgs(otherAddress.address)
    })

    it("Reverts if the reporter is not enabled", async function () {
      const { handler, reporter, sygmaAdapter } = await setup()
      await expect(sygmaAdapter.connect(handler).storeHashes(reporter.address, [ID1, ID2], [HASH1, HASH2]))
        .to.be.revertedWithCustomError(sygmaAdapter, "InvalidReporter")
        .withArgs(reporter.address)
    })

    it("Overwrites previous hashes", async function () {
      const { handler, reporter, sygmaAdapter } = await setup()
      await expect(sygmaAdapter.setReporter(reporter.address, DOMAIN_ID, true))
        .to.emit(sygmaAdapter, "ReporterSet")
        .withArgs(reporter.address, DOMAIN_ID, true)
      await expect(sygmaAdapter.connect(handler).storeHashes(reporter.address, [ID1, ID2], [HASH1, HASH2]))
        .to.emit(sygmaAdapter, "HashStored")
        .withArgs(ID1, HASH1)
        .and.to.emit(sygmaAdapter, "HashStored")
        .withArgs(ID2, HASH2)
      expect(await sygmaAdapter.getHashFromOracle(DOMAIN_ID, ID1)).to.equal(HASH1)
      expect(await sygmaAdapter.getHashFromOracle(DOMAIN_ID, ID2)).to.equal(HASH2)

      await expect(sygmaAdapter.connect(handler).storeHashes(reporter.address, [ID1, ID2], [HASH2, HASH1]))
        .to.emit(sygmaAdapter, "HashStored")
        .withArgs(ID1, HASH2)
        .and.to.emit(sygmaAdapter, "HashStored")
        .withArgs(ID2, HASH1)
      expect(await sygmaAdapter.getHashFromOracle(DOMAIN_ID, ID1)).to.equal(HASH2)
      expect(await sygmaAdapter.getHashFromOracle(DOMAIN_ID, ID2)).to.equal(HASH1)
    })
  })
})
*/
