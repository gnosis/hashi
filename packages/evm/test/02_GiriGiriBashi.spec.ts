import { expect } from "chai"
import { ethers } from "hardhat"

const DOMAIN_ID = 1
const HASH_ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000"
const HASH_GOOD = "0x0000000000000000000000000000000000000000000000000000000000000001"
const HASH_BAD = "0x0000000000000000000000000000000000000000000000000000000000000bad"
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000"
const LIST_END = "0x0000000000000000000000000000000000000001"
const ADDRESS_TWO = "0x0000000000000000000000000000000000000002"
const ADDRESS_THREE = "0x0000000000000000000000000000000000000003"

const setup = async () => {
  const [wallet] = await ethers.getSigners()
  const Hashi = await ethers.getContractFactory("Hashi")
  const hashi = await Hashi.deploy()
  const GiriGiriBashi = await ethers.getContractFactory("GiriGiriBashi")
  const giriGiriBashi = await GiriGiriBashi.deploy(wallet.address, hashi.address)
  const MockOracleAdapter = await ethers.getContractFactory("MockOracleAdapter")
  const mockOracleAdapter = await MockOracleAdapter.deploy()
  const anotherOracleAdapter = await MockOracleAdapter.deploy()

  await mockOracleAdapter.setHashes(DOMAIN_ID, [0, 1], [HASH_ZERO, HASH_GOOD])
  await anotherOracleAdapter.setHashes(DOMAIN_ID, [0, 1], [HASH_ZERO, HASH_GOOD])
  await giriGiriBashi.setThreshold(DOMAIN_ID, 2)

  return {
    wallet,
    hashi,
    GiriGiriBashi,
    giriGiriBashi,
    mockOracleAdapter,
    anotherOracleAdapter,
  }
}

describe("GiriGiriBashi", function () {
  describe("Deploy", function () {
    it("Successfully deploys contract", async function () {
      const { hashi, giriGiriBashi, wallet } = await setup()
      expect(await giriGiriBashi.deployed())
      expect(await giriGiriBashi.owner()).to.equal(wallet.address)
      expect(await giriGiriBashi.hashi()).to.equal(hashi.address)
    })
    it("Emits Initialized event", async function () {
      const { giriGiriBashi } = await setup()
      const event = await giriGiriBashi.filters.Init(null, null)
      await expect(event.address).to.equal(giriGiriBashi.address)
    })
  })

  describe("setHashi()", function () {
    it("Reverts if called by non-owner account", async function () {
      const { giriGiriBashi, wallet } = await setup()
      await giriGiriBashi.transferOwnership(giriGiriBashi.address)
      await expect(giriGiriBashi.setHashi(wallet.address)).to.be.revertedWith("Ownable: caller is not the owner")
    })
    it("Reverts if hashi is already set to this address", async function () {
      const { hashi, giriGiriBashi } = await setup()
      await expect(giriGiriBashi.setHashi(hashi.address)).to.be.revertedWithCustomError(
        giriGiriBashi,
        "DuplicateHashiAddress",
      )
    })
    it("Sets Hashi address", async function () {
      const { giriGiriBashi, wallet } = await setup()
      await giriGiriBashi.setHashi(wallet.address)
      expect(await giriGiriBashi.hashi()).to.equal(wallet.address)
    })
    it("Emits HashiSet() event", async function () {
      const { giriGiriBashi, wallet } = await setup()
      await expect(giriGiriBashi.setHashi(wallet.address))
        .to.emit(giriGiriBashi, "HashiSet")
        .withArgs(giriGiriBashi.address, wallet.address)
    })
  })

  describe("setThreshold()", function () {
    it("Reverts if called by non-owner account", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.transferOwnership(giriGiriBashi.address)
      await expect(giriGiriBashi.setThreshold(DOMAIN_ID, 2)).to.be.revertedWith("Ownable: caller is not the owner")
    })
    it("Reverts if threshold is already set", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.setThreshold(DOMAIN_ID, 2)).to.be.revertedWithCustomError(
        giriGiriBashi,
        "DuplicateThreashold",
      )
    })
    it("Sets threshold for the given ChainID", async function () {
      const { giriGiriBashi } = await setup()
      expect(await giriGiriBashi.setThreshold(DOMAIN_ID, 3))
      expect((await giriGiriBashi.domains(DOMAIN_ID)).threshold).to.equal(3)
    })
    it("Emits HashiSet() event", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.setThreshold(DOMAIN_ID, 3))
        .to.emit(giriGiriBashi, "ThresholdSet")
        .withArgs(giriGiriBashi.address, DOMAIN_ID, 3)
    })
  })

  describe("enableOracleAdapters()", function () {
    it("Reverts if called by non-owner account", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.transferOwnership(giriGiriBashi.address)
      await expect(giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO])).to.be.revertedWith(
        "Ownable: caller is not the owner",
      )
    })
    it("Reverts if given an empty array", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "NoAdaptersGiven",
      )
    })
    it("Reverts if given oracle adapter is Address(0)", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_ZERO])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "InvalidAdapter",
      )
    })
    it("Reverts if given oracle adapter is Address(1) / LIST_END", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [LIST_END])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "InvalidAdapter",
      )
    })
    it("Reverts if adapter is already enabled", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO]))
      await expect(giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "AdapterAlreadyEnabled",
      )
    })
    it("Enables the given oracles", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE]))
      const adapters = await giriGiriBashi.getOracleAdapters(DOMAIN_ID)
      await expect(adapters[0]).to.equal(ADDRESS_TWO)
      await expect(adapters[1]).to.equal(ADDRESS_THREE)
      expect((await giriGiriBashi.adapters(DOMAIN_ID, LIST_END)).next).to.equal(ADDRESS_TWO)
      expect((await giriGiriBashi.adapters(DOMAIN_ID, LIST_END)).previous).to.equal(ADDRESS_THREE)
      expect((await giriGiriBashi.adapters(DOMAIN_ID, ADDRESS_TWO)).next).to.equal(ADDRESS_THREE)
      expect((await giriGiriBashi.adapters(DOMAIN_ID, ADDRESS_TWO)).previous).to.equal(LIST_END)
      expect((await giriGiriBashi.adapters(DOMAIN_ID, ADDRESS_THREE)).next).to.equal(LIST_END)
      expect((await giriGiriBashi.adapters(DOMAIN_ID, ADDRESS_THREE)).previous).to.equal(ADDRESS_TWO)
    })
    it("Emits OracleAdaptersEnabled() event", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE]))
        .to.emit(giriGiriBashi, "OracleAdaptersEnabled")
        .withArgs(giriGiriBashi.address, DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
    })
  })

  describe("disableOracleAdapters()", function () {
    it("Reverts if called by non-owner account", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.transferOwnership(giriGiriBashi.address)
      await expect(giriGiriBashi.disableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO])).to.be.revertedWith(
        "Ownable: caller is not the owner",
      )
    })
    it("Reverts if no adapters are enabled", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.disableOracleAdapters(DOMAIN_ID, [])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "NoAdaptersEnabled",
      )
    })
    it("Reverts if given an empty array", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO])
      await expect(giriGiriBashi.disableOracleAdapters(DOMAIN_ID, [])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "NoAdaptersGiven",
      )
    })
    it("Reverts if given oracle adapter is Address(0)", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO])
      await expect(giriGiriBashi.disableOracleAdapters(DOMAIN_ID, [ADDRESS_ZERO])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "InvalidAdapter",
      )
    })
    it("Reverts if given oracle adapter is Address(1) / LIST_END", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO])
      await expect(giriGiriBashi.disableOracleAdapters(DOMAIN_ID, [LIST_END])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "InvalidAdapter",
      )
    })
    it("Reverts if adapter is not enabled", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO])
      await expect(
        giriGiriBashi.disableOracleAdapters(DOMAIN_ID, [ADDRESS_THREE, ADDRESS_TWO]),
      ).to.be.revertedWithCustomError(giriGiriBashi, "AdapterNotEnabled")
    })
    it("Disables the given oracles", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await giriGiriBashi.disableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      const adapters = await giriGiriBashi.getOracleAdapters(DOMAIN_ID)
      await expect(adapters[0]).to.equal(undefined)
    })
    it("Emits OracleAdaptersDisabled() event", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(giriGiriBashi.disableOracleAdapters(DOMAIN_ID, [ADDRESS_THREE, ADDRESS_TWO]))
        .to.emit(giriGiriBashi, "OracleAdaptersDisabled")
        .withArgs(giriGiriBashi.address, DOMAIN_ID, [ADDRESS_THREE, ADDRESS_TWO])
    })
  })

  describe("getOracleAdapters()", function () {
    it("Returns empty array if no adapters are enabled", async function () {
      const { giriGiriBashi } = await setup()
      const adapters = await giriGiriBashi.getOracleAdapters(DOMAIN_ID)
      expect(adapters[0]).to.equal(undefined)
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(giriGiriBashi.disableOracleAdapters(DOMAIN_ID, [ADDRESS_THREE, ADDRESS_TWO]))
      expect(adapters[0]).to.equal(undefined)
    })
    it("Returns array of enabled adapters", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      const adapters = await giriGiriBashi.getOracleAdapters(DOMAIN_ID)
      expect(adapters[0]).to.equal(ADDRESS_TWO)
      expect(adapters[1]).to.equal(ADDRESS_THREE)
    })
  })

  describe("getThresholdAndCount()", function () {
    it("Returns threshold equal to count if threshold not explicitly set", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      const [threshold, count] = await giriGiriBashi.getThresholdAndCount(DOMAIN_ID)
      await expect(threshold).to.equal(count)
    })
    it("Returns threshold and count", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 1)
      const [threshold] = await giriGiriBashi.getThresholdAndCount(DOMAIN_ID)
      await expect(threshold).to.equal(1)
    })
  })

  describe("getUnanimousHash()", function () {
    it("Reverts if no adapters are enabled", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.getUnanimousHash(DOMAIN_ID, 1)).to.be.revertedWithCustomError(
        giriGiriBashi,
        "NoAdaptersEnabled",
      )
    })
    it("Reverts if threshold is not met", async function () {
      const { giriGiriBashi, mockOracleAdapter } = await setup()
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [mockOracleAdapter.address])
      await expect(giriGiriBashi.getUnanimousHash(DOMAIN_ID, 1)).to.be.revertedWithCustomError(
        giriGiriBashi,
        "ThresholdNotMet",
      )
    })
    it("Returns unanimous agreed on hash", async function () {
      const { giriGiriBashi, mockOracleAdapter, anotherOracleAdapter } = await setup()
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [mockOracleAdapter.address, anotherOracleAdapter.address])
      expect(await giriGiriBashi.getUnanimousHash(DOMAIN_ID, 1)).to.equal(HASH_GOOD)
    })
  })

  describe("getHash()", function () {
    it("Reverts if threshold is not met", async function () {
      const { giriGiriBashi, mockOracleAdapter } = await setup()
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [mockOracleAdapter.address])
      await expect(giriGiriBashi.getHash(DOMAIN_ID, 1, [mockOracleAdapter.address])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "ThresholdNotMet",
      )
    })
    it("Reverts if given oracle adapters are duplicate", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(giriGiriBashi.getHash(DOMAIN_ID, 1, [ADDRESS_TWO, ADDRESS_TWO])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "DuplicateOrOutOfOrderAdapters",
      )
    })
    it("Reverts if given oracle adapters are out of order", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(giriGiriBashi.getHash(DOMAIN_ID, 1, [ADDRESS_THREE, ADDRESS_TWO])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "DuplicateOrOutOfOrderAdapters",
      )
    })
    it("Reverts if given oracle adapter is not enabled", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO])
      await expect(giriGiriBashi.getHash(DOMAIN_ID, 1, [ADDRESS_TWO, ADDRESS_THREE])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "InvalidAdapter",
      )
    })
    it("Reverts if no oracle adapters are enabled", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.getHash(DOMAIN_ID, 1, [ADDRESS_TWO, ADDRESS_THREE])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "NoAdaptersEnabled",
      )
    })
    it("Reverts if no oracle adapters are given", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO])
      await expect(giriGiriBashi.getHash(DOMAIN_ID, 1, [])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "NoAdaptersGiven",
      )
    })
    it("Returns unanimous agreed on hash", async function () {
      const { giriGiriBashi, mockOracleAdapter, anotherOracleAdapter } = await setup()
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [mockOracleAdapter.address, anotherOracleAdapter.address])
      let adapters
      if (anotherOracleAdapter.address > mockOracleAdapter.address) {
        adapters = [mockOracleAdapter.address, anotherOracleAdapter.address]
      } else {
        adapters = [anotherOracleAdapter.address, mockOracleAdapter.address]
      }
      expect(await giriGiriBashi.getHash(DOMAIN_ID, 1, adapters)).to.equal(HASH_GOOD)
    })
  })
})
