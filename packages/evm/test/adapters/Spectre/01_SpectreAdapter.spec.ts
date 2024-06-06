import { expect } from "chai"
import { ethers, network } from "hardhat"

const DOMAIN_ID = 5
const ID_ONE = 1
const ID_TWO = 2
const HASH_ONE = "0x0000000000000000000000000000000000000000000000000000000000000001"
const HASH_TWO = "0x0000000000000000000000000000000000000000000000000000000000000002"

const setup = async () => {
  await network.provider.request({ method: "hardhat_reset", params: [] })
  const signers = await ethers.getSigners()
  const admin = signers[0]
  const reporter = signers[1]
  const handler = signers[2]
  const otherAddress = signers[3]
  const SpectreAdapter = await ethers.getContractFactory("SpectreAdapter")
  const spectreAdapter = await SpectreAdapter.deploy(handler.address)
  return {
    admin,
    reporter,
    handler,
    otherAddress,
    spectreAdapter,
  }
}

describe("SpectreAdapter", function () {
  describe("Constructor", function () {
    it("Successfully deploys contract with correct state", async function () {
      const { handler, spectreAdapter } = await setup()
      expect(await spectreAdapter.deployed())
      expect(await spectreAdapter._handler()).to.equal(handler.address)
    })
  })

  describe("setReporter()", function () {
    it("Enables the reporter and sets its chainID", async function () {
      const { reporter, spectreAdapter } = await setup()
      expect(await spectreAdapter.deployed())
      await expect(spectreAdapter.setReporter(reporter.address, DOMAIN_ID, true))
        .to.emit(spectreAdapter, "ReporterSet")
        .withArgs(reporter.address, DOMAIN_ID, true)
      const result = await spectreAdapter.reporters(reporter.address)
      expect(result[0].toNumber()).to.equal(DOMAIN_ID)
      expect(result[1]).to.equal(true)
    })

    it("Disables the reporter", async function () {
      const { reporter, spectreAdapter } = await setup()
      expect(await spectreAdapter.deployed())
      await expect(spectreAdapter.setReporter(reporter.address, DOMAIN_ID, true))
        .to.emit(spectreAdapter, "ReporterSet")
        .withArgs(reporter.address, DOMAIN_ID, true)
      let result = await spectreAdapter.reporters(reporter.address)
      expect(result[1]).to.equal(true)
      await expect(spectreAdapter.setReporter(reporter.address, DOMAIN_ID, false))
        .to.emit(spectreAdapter, "ReporterSet")
        .withArgs(reporter.address, DOMAIN_ID, false)
      result = await spectreAdapter.reporters(reporter.address)
      expect(result[1]).to.equal(false)
    })

    it("Doesn't set the reporter if the sender is unauthorized", async function () {
      const { reporter, spectreAdapter, otherAddress } = await setup()
      expect(await spectreAdapter.deployed())
      await expect(
        spectreAdapter.connect(otherAddress).setReporter(reporter.address, DOMAIN_ID, true),
      ).to.be.revertedWithCustomError(spectreAdapter, "Unauthorized")
    })
  })

  describe("StoreHashes()", function () {
    it("Stores hashes", async function () {
      const { handler, reporter, spectreAdapter } = await setup()
      await expect(spectreAdapter.setReporter(reporter.address, DOMAIN_ID, true))
        .to.emit(spectreAdapter, "ReporterSet")
        .withArgs(reporter.address, DOMAIN_ID, true)
      await expect(
        spectreAdapter.connect(handler).storeHashes(reporter.address, [ID_ONE, ID_TWO], [HASH_ONE, HASH_TWO]),
      )
        .to.emit(spectreAdapter, "HashStored")
        .withArgs(ID_ONE, HASH_ONE)
        .and.to.emit(spectreAdapter, "HashStored")
        .withArgs(ID_TWO, HASH_TWO)
      expect(await spectreAdapter.getHash(DOMAIN_ID, ID_ONE)).to.equal(HASH_ONE)
    })

    it("Reverts if array lengths mismatch", async function () {
      const { handler, reporter, spectreAdapter } = await setup()
      await expect(spectreAdapter.setReporter(reporter.address, DOMAIN_ID, true))
        .to.emit(spectreAdapter, "ReporterSet")
        .withArgs(reporter.address, DOMAIN_ID, true)
      await expect(
        spectreAdapter.connect(handler).storeHashes(reporter.address, [ID_ONE, ID_TWO], [HASH_ONE]),
      ).to.be.revertedWithCustomError(spectreAdapter, "ArrayLengthMismatch")
    })

    it("Reverts if sender is not the authorized handler", async function () {
      const { otherAddress, reporter, spectreAdapter } = await setup()
      await expect(spectreAdapter.setReporter(reporter.address, DOMAIN_ID, true))
        .to.emit(spectreAdapter, "ReporterSet")
        .withArgs(reporter.address, DOMAIN_ID, true)
      await expect(
        spectreAdapter.connect(otherAddress).storeHashes(reporter.address, [ID_ONE, ID_TWO], [HASH_ONE, HASH_TWO]),
      )
        .to.be.revertedWithCustomError(spectreAdapter, "InvalidHandler")
        .withArgs(otherAddress.address)
    })

    it("Reverts if the reporter is not enabled", async function () {
      const { handler, reporter, spectreAdapter } = await setup()
      await expect(
        spectreAdapter.connect(handler).storeHashes(reporter.address, [ID_ONE, ID_TWO], [HASH_ONE, HASH_TWO]),
      )
        .to.be.revertedWithCustomError(spectreAdapter, "InvalidReporter")
        .withArgs(reporter.address)
    })

    it("Overwrites previous hashes", async function () {
      const { handler, reporter, spectreAdapter } = await setup()
      await expect(spectreAdapter.setReporter(reporter.address, DOMAIN_ID, true))
        .to.emit(spectreAdapter, "ReporterSet")
        .withArgs(reporter.address, DOMAIN_ID, true)
      await expect(
        spectreAdapter.connect(handler).storeHashes(reporter.address, [ID_ONE, ID_TWO], [HASH_ONE, HASH_TWO]),
      )
        .to.emit(spectreAdapter, "HashStored")
        .withArgs(ID_ONE, HASH_ONE)
        .and.to.emit(spectreAdapter, "HashStored")
        .withArgs(ID_TWO, HASH_TWO)
      expect(await spectreAdapter.getHash(DOMAIN_ID, ID_ONE)).to.equal(HASH_ONE)
      expect(await spectreAdapter.getHash(DOMAIN_ID, ID_TWO)).to.equal(HASH_TWO)

      await expect(
        spectreAdapter.connect(handler).storeHashes(reporter.address, [ID_ONE, ID_TWO], [HASH_TWO, HASH_ONE]),
      )
        .to.emit(spectreAdapter, "HashStored")
        .withArgs(ID_ONE, HASH_TWO)
        .and.to.emit(spectreAdapter, "HashStored")
        .withArgs(ID_TWO, HASH_ONE)
      expect(await spectreAdapter.getHash(DOMAIN_ID, ID_ONE)).to.equal(HASH_TWO)
      expect(await spectreAdapter.getHash(DOMAIN_ID, ID_TWO)).to.equal(HASH_ONE)
    })
  })
})
