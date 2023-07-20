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
  const ShoyuBashi = await ethers.getContractFactory("ShoyuBashi")
  const shoyuBashi = await ShoyuBashi.deploy(wallet.address, hashi.address)
  const MockOracleAdapter = await ethers.getContractFactory("MockOracleAdapter")
  const mockOracleAdapter = await MockOracleAdapter.deploy()
  const anotherOracleAdapter = await MockOracleAdapter.deploy()

  await mockOracleAdapter.setHashes(DOMAIN_ID, [0, 1, 2], [HASH_ZERO, HASH_GOOD, HASH_GOOD])
  await anotherOracleAdapter.setHashes(DOMAIN_ID, [0, 1, 2], [HASH_ZERO, HASH_GOOD, HASH_BAD])
  await shoyuBashi.setThreshold(DOMAIN_ID, 2)

  return {
    wallet,
    hashi,
    ShoyuBashi,
    shoyuBashi,
    mockOracleAdapter,
    anotherOracleAdapter,
  }
}

describe("ShoyuBashi", function () {
  describe("Deploy", function () {
    it("Successfully deploys contract", async function () {
      const { hashi, shoyuBashi, wallet } = await setup()
      expect(await shoyuBashi.deployed())
      expect(await shoyuBashi.owner()).to.equal(wallet.address)
      expect(await shoyuBashi.hashi()).to.equal(hashi.address)
    })
    it("Emits Initialized event", async function () {
      const { shoyuBashi } = await setup()
      const event = await shoyuBashi.filters.Init(null, null)
      await expect(event.address).to.equal(shoyuBashi.address)
    })
  })

  describe("setHashi()", function () {
    it("Reverts if called by non-owner account", async function () {
      const { shoyuBashi, wallet } = await setup()
      await shoyuBashi.transferOwnership(shoyuBashi.address)
      await expect(shoyuBashi.setHashi(wallet.address)).to.be.revertedWith("Ownable: caller is not the owner")
    })
    it("Reverts if hashi is already set to this address", async function () {
      const { hashi, shoyuBashi } = await setup()
      await expect(shoyuBashi.setHashi(hashi.address)).to.be.revertedWithCustomError(
        shoyuBashi,
        "DuplicateHashiAddress",
      )
    })
    it("Sets Hashi address", async function () {
      const { shoyuBashi, wallet } = await setup()
      await shoyuBashi.setHashi(wallet.address)
      expect(await shoyuBashi.hashi()).to.equal(wallet.address)
    })
    it("Emits HashiSet() event", async function () {
      const { shoyuBashi, wallet } = await setup()
      await expect(shoyuBashi.setHashi(wallet.address))
        .to.emit(shoyuBashi, "HashiSet")
        .withArgs(shoyuBashi.address, wallet.address)
    })
  })

  describe("setThreshold()", function () {
    it("Reverts if called by non-owner account", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.transferOwnership(shoyuBashi.address)
      await expect(shoyuBashi.setThreshold(DOMAIN_ID, 2)).to.be.revertedWith("Ownable: caller is not the owner")
    })
    it("Reverts if threshold is already set", async function () {
      const { shoyuBashi } = await setup()
      await expect(shoyuBashi.setThreshold(DOMAIN_ID, 2)).to.be.revertedWithCustomError(
        shoyuBashi,
        "DuplicateThreashold",
      )
    })
    it("Sets threshold for the given ChainID", async function () {
      const { shoyuBashi } = await setup()
      expect(await shoyuBashi.setThreshold(DOMAIN_ID, 3))
      expect((await shoyuBashi.domains(DOMAIN_ID)).threshold).to.equal(3)
    })
    it("Emits HashiSet() event", async function () {
      const { shoyuBashi } = await setup()
      await expect(shoyuBashi.setThreshold(DOMAIN_ID, 3))
        .to.emit(shoyuBashi, "ThresholdSet")
        .withArgs(shoyuBashi.address, DOMAIN_ID, 3)
    })
  })

  describe("enableOracleAdapters()", function () {
    it("Reverts if called by non-owner account", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.transferOwnership(shoyuBashi.address)
      await expect(shoyuBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO])).to.be.revertedWith(
        "Ownable: caller is not the owner",
      )
    })
    it("Reverts if given an empty array", async function () {
      const { shoyuBashi } = await setup()
      await expect(shoyuBashi.enableOracleAdapters(DOMAIN_ID, [])).to.be.revertedWithCustomError(
        shoyuBashi,
        "NoAdaptersGiven",
      )
    })
    it("Reverts if given oracle adapter is Address(0)", async function () {
      const { shoyuBashi } = await setup()
      await expect(shoyuBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_ZERO])).to.be.revertedWithCustomError(
        shoyuBashi,
        "InvalidAdapter",
      )
    })
    it("Reverts if given oracle adapter is Address(1) / LIST_END", async function () {
      const { shoyuBashi } = await setup()
      await expect(shoyuBashi.enableOracleAdapters(DOMAIN_ID, [LIST_END])).to.be.revertedWithCustomError(
        shoyuBashi,
        "InvalidAdapter",
      )
    })
    it("Reverts if adapter is already enabled", async function () {
      const { shoyuBashi } = await setup()
      await expect(shoyuBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO]))
      await expect(shoyuBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO])).to.be.revertedWithCustomError(
        shoyuBashi,
        "AdapterAlreadyEnabled",
      )
    })
    it("Enables the given oracles", async function () {
      const { shoyuBashi } = await setup()
      await expect(shoyuBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE]))
      const adapters = await shoyuBashi.getOracleAdapters(DOMAIN_ID)
      await expect(adapters[0]).to.equal(ADDRESS_TWO)
      await expect(adapters[1]).to.equal(ADDRESS_THREE)
      expect((await shoyuBashi.adapters(DOMAIN_ID, LIST_END)).next).to.equal(ADDRESS_TWO)
      expect((await shoyuBashi.adapters(DOMAIN_ID, LIST_END)).previous).to.equal(ADDRESS_THREE)
      expect((await shoyuBashi.adapters(DOMAIN_ID, ADDRESS_TWO)).next).to.equal(ADDRESS_THREE)
      expect((await shoyuBashi.adapters(DOMAIN_ID, ADDRESS_TWO)).previous).to.equal(LIST_END)
      expect((await shoyuBashi.adapters(DOMAIN_ID, ADDRESS_THREE)).next).to.equal(LIST_END)
      expect((await shoyuBashi.adapters(DOMAIN_ID, ADDRESS_THREE)).previous).to.equal(ADDRESS_TWO)
    })
    it("Emits OracleAdaptersEnabled() event", async function () {
      const { shoyuBashi } = await setup()
      await expect(shoyuBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE]))
        .to.emit(shoyuBashi, "OracleAdaptersEnabled")
        .withArgs(shoyuBashi.address, DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
    })
  })

  describe("disableOracleAdapters()", function () {
    it("Reverts if called by non-owner account", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.transferOwnership(shoyuBashi.address)
      await expect(shoyuBashi.disableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO])).to.be.revertedWith(
        "Ownable: caller is not the owner",
      )
    })
    it("Reverts if no adapters are enabled", async function () {
      const { shoyuBashi } = await setup()
      await expect(shoyuBashi.disableOracleAdapters(DOMAIN_ID, [])).to.be.revertedWithCustomError(
        shoyuBashi,
        "NoAdaptersEnabled",
      )
    })
    it("Reverts if given an empty array", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO])
      await expect(shoyuBashi.disableOracleAdapters(DOMAIN_ID, [])).to.be.revertedWithCustomError(
        shoyuBashi,
        "NoAdaptersGiven",
      )
    })
    it("Reverts if given oracle adapter is Address(0)", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO])
      await expect(shoyuBashi.disableOracleAdapters(DOMAIN_ID, [ADDRESS_ZERO])).to.be.revertedWithCustomError(
        shoyuBashi,
        "InvalidAdapter",
      )
    })
    it("Reverts if given oracle adapter is Address(1) / LIST_END", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO])
      await expect(shoyuBashi.disableOracleAdapters(DOMAIN_ID, [LIST_END])).to.be.revertedWithCustomError(
        shoyuBashi,
        "InvalidAdapter",
      )
    })
    it("Reverts if adapter is not enabled", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO])
      await expect(
        shoyuBashi.disableOracleAdapters(DOMAIN_ID, [ADDRESS_THREE, ADDRESS_TWO]),
      ).to.be.revertedWithCustomError(shoyuBashi, "AdapterNotEnabled")
    })
    it("Disables the given oracles", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await shoyuBashi.disableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      const adapters = await shoyuBashi.getOracleAdapters(DOMAIN_ID)
      await expect(adapters[0]).to.equal(undefined)
    })
    it("Emits OracleAdaptersDisabled() event", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(shoyuBashi.disableOracleAdapters(DOMAIN_ID, [ADDRESS_THREE, ADDRESS_TWO]))
        .to.emit(shoyuBashi, "OracleAdaptersDisabled")
        .withArgs(shoyuBashi.address, DOMAIN_ID, [ADDRESS_THREE, ADDRESS_TWO])
    })
  })

  describe("getOracleAdapters()", function () {
    it("Returns empty array if no adapters are enabled", async function () {
      const { shoyuBashi } = await setup()
      const adapters = await shoyuBashi.getOracleAdapters(DOMAIN_ID)
      expect(adapters[0]).to.equal(undefined)
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(shoyuBashi.disableOracleAdapters(DOMAIN_ID, [ADDRESS_THREE, ADDRESS_TWO]))
      expect(adapters[0]).to.equal(undefined)
    })
    it("Returns array of enabled adapters", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      const adapters = await shoyuBashi.getOracleAdapters(DOMAIN_ID)
      expect(adapters[0]).to.equal(ADDRESS_TWO)
      expect(adapters[1]).to.equal(ADDRESS_THREE)
    })
  })

  describe("getThresholdAndCount()", function () {
    it("Returns threshold equal to count if threshold not explicitly set", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      const [threshold, count] = await shoyuBashi.getThresholdAndCount(DOMAIN_ID)
      await expect(threshold).to.equal(count)
    })
    it("Returns threshold and count", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await shoyuBashi.setThreshold(DOMAIN_ID, 1)
      const [threshold] = await shoyuBashi.getThresholdAndCount(DOMAIN_ID)
      await expect(threshold).to.equal(1)
    })
  })

  describe("getUnanimousHash()", function () {
    it("Reverts if no adapters are enabled", async function () {
      const { shoyuBashi } = await setup()
      await expect(shoyuBashi.getUnanimousHash(DOMAIN_ID, 1)).to.be.revertedWithCustomError(
        shoyuBashi,
        "NoAdaptersEnabled",
      )
    })
    it("Reverts if threshold is not met", async function () {
      const { shoyuBashi, mockOracleAdapter } = await setup()
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [mockOracleAdapter.address])
      await expect(shoyuBashi.getUnanimousHash(DOMAIN_ID, 1)).to.be.revertedWithCustomError(
        shoyuBashi,
        "ThresholdNotMet",
      )
    })
    it("Returns unanimous agreed on hash", async function () {
      const { shoyuBashi, mockOracleAdapter, anotherOracleAdapter } = await setup()
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [mockOracleAdapter.address, anotherOracleAdapter.address])
      expect(await shoyuBashi.getUnanimousHash(DOMAIN_ID, 1)).to.equal(HASH_GOOD)
    })
  })

  describe("getThresholdHash()", function () {
    it("Reverts if no adapters are enabled", async function () {
      const { shoyuBashi } = await setup()
      await expect(shoyuBashi.getThresholdHash(DOMAIN_ID, 1)).to.be.revertedWithCustomError(
        shoyuBashi,
        "NoAdaptersEnabled",
      )
    })
    it("Reverts if threshold is not met", async function () {
      const { shoyuBashi, mockOracleAdapter, anotherOracleAdapter } = await setup()
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [mockOracleAdapter.address, anotherOracleAdapter.address])
      await expect(shoyuBashi.getThresholdHash(DOMAIN_ID, 2)).to.be.revertedWithCustomError(
        shoyuBashi,
        "ThresholdNotMet",
      )
    })
    it("Reverts if threshold returns bytes(0)", async function () {
      const { shoyuBashi, mockOracleAdapter, anotherOracleAdapter } = await setup()
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [mockOracleAdapter.address, anotherOracleAdapter.address])
      await expect(shoyuBashi.getThresholdHash(DOMAIN_ID, 0)).to.be.revertedWithCustomError(
        shoyuBashi,
        "ThresholdNotMet",
      )
    })
    it("Returns unanimous agreed on hash", async function () {
      const { shoyuBashi, mockOracleAdapter, anotherOracleAdapter } = await setup()
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [mockOracleAdapter.address, anotherOracleAdapter.address])
      expect(await shoyuBashi.getThresholdHash(DOMAIN_ID, 1)).to.equal(HASH_GOOD)
    })
  })

  describe("getHash()", function () {
    it("Reverts if threshold is not met", async function () {
      const { shoyuBashi, mockOracleAdapter } = await setup()
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [mockOracleAdapter.address])
      await expect(shoyuBashi.getHash(DOMAIN_ID, 1, [mockOracleAdapter.address])).to.be.revertedWithCustomError(
        shoyuBashi,
        "ThresholdNotMet",
      )
    })
    it("Reverts if given oracle adapters are duplicate", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(shoyuBashi.getHash(DOMAIN_ID, 1, [ADDRESS_TWO, ADDRESS_TWO])).to.be.revertedWithCustomError(
        shoyuBashi,
        "DuplicateOrOutOfOrderAdapters",
      )
    })
    it("Reverts if given oracle adapters are out of order", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(shoyuBashi.getHash(DOMAIN_ID, 1, [ADDRESS_THREE, ADDRESS_TWO])).to.be.revertedWithCustomError(
        shoyuBashi,
        "DuplicateOrOutOfOrderAdapters",
      )
    })
    it("Reverts if given oracle adapter is not enabled", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO])
      await expect(shoyuBashi.getHash(DOMAIN_ID, 1, [ADDRESS_TWO, ADDRESS_THREE])).to.be.revertedWithCustomError(
        shoyuBashi,
        "InvalidAdapter",
      )
    })
    it("Reverts if no oracle adapters are enabled", async function () {
      const { shoyuBashi } = await setup()
      await expect(shoyuBashi.getHash(DOMAIN_ID, 1, [ADDRESS_TWO, ADDRESS_THREE])).to.be.revertedWithCustomError(
        shoyuBashi,
        "NoAdaptersEnabled",
      )
    })
    it("Reverts if no oracle adapters are given", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO])
      await expect(shoyuBashi.getHash(DOMAIN_ID, 1, [])).to.be.revertedWithCustomError(shoyuBashi, "NoAdaptersGiven")
    })
    it("Returns unanimous agreed on hash", async function () {
      const { shoyuBashi, mockOracleAdapter, anotherOracleAdapter } = await setup()
      await shoyuBashi.enableOracleAdapters(DOMAIN_ID, [mockOracleAdapter.address, anotherOracleAdapter.address])
      let adapters
      if (anotherOracleAdapter.address > mockOracleAdapter.address) {
        adapters = [mockOracleAdapter.address, anotherOracleAdapter.address]
      } else {
        adapters = [anotherOracleAdapter.address, mockOracleAdapter.address]
      }
      expect(await shoyuBashi.getHash(DOMAIN_ID, 1, adapters)).to.equal(HASH_GOOD)
    })
  })
})
