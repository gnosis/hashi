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
  const MockAdapter = await ethers.getContractFactory("MockAdapter")
  const mockAdapter = await MockAdapter.deploy()
  const anotherAdapter = await MockAdapter.deploy()

  await mockAdapter.setHashes(DOMAIN_ID, [0, 1, 2], [HASH_ZERO, HASH_GOOD, HASH_GOOD])
  await anotherAdapter.setHashes(DOMAIN_ID, [0, 1, 2], [HASH_ZERO, HASH_GOOD, HASH_BAD])

  return {
    wallet,
    hashi,
    ShoyuBashi,
    shoyuBashi,
    mockAdapter,
    anotherAdapter,
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
      await expect(shoyuBashi.setHashi(wallet.address)).to.emit(shoyuBashi, "HashiSet").withArgs(wallet.address)
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
      await shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await shoyuBashi.setThreshold(DOMAIN_ID, 2)
      await expect(shoyuBashi.setThreshold(DOMAIN_ID, 2)).to.be.revertedWithCustomError(
        shoyuBashi,
        "DuplicateThreashold",
      )
    })
    it("Sets threshold for the given ChainID", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      expect(await shoyuBashi.setThreshold(DOMAIN_ID, 2))
      expect((await shoyuBashi.domains(DOMAIN_ID)).threshold).to.equal(2)
    })
    it("Emits HashiSet() event", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(shoyuBashi.setThreshold(DOMAIN_ID, 2)).to.emit(shoyuBashi, "ThresholdSet").withArgs(DOMAIN_ID, 2)
    })
  })

  describe("enableAdapters()", function () {
    it("Reverts if called by non-owner account", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.transferOwnership(shoyuBashi.address)
      await expect(shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO])).to.be.revertedWith(
        "Ownable: caller is not the owner",
      )
    })
    it("Reverts if given an empty array", async function () {
      const { shoyuBashi } = await setup()
      await expect(shoyuBashi.enableAdapters(DOMAIN_ID, [])).to.be.revertedWithCustomError(
        shoyuBashi,
        "NoAdaptersGiven",
      )
    })
    it("Reverts if given adapter is Address(0)", async function () {
      const { shoyuBashi } = await setup()
      await expect(shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_ZERO])).to.be.revertedWithCustomError(
        shoyuBashi,
        "InvalidAdapter",
      )
    })
    it("Reverts if given adapter is Address(1) / LIST_END", async function () {
      const { shoyuBashi } = await setup()
      await expect(shoyuBashi.enableAdapters(DOMAIN_ID, [LIST_END])).to.be.revertedWithCustomError(
        shoyuBashi,
        "InvalidAdapter",
      )
    })
    it("Reverts if adapter is already enabled", async function () {
      const { shoyuBashi } = await setup()
      await expect(shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO]))
      await expect(shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO])).to.be.revertedWithCustomError(
        shoyuBashi,
        "AdapterAlreadyEnabled",
      )
    })
    it("Enables the given adapters", async function () {
      const { shoyuBashi } = await setup()
      await expect(shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE]))
      const adapters = await shoyuBashi.getAdapters(DOMAIN_ID)
      await expect(adapters[0]).to.equal(ADDRESS_TWO)
      await expect(adapters[1]).to.equal(ADDRESS_THREE)
      expect((await shoyuBashi.adapters(DOMAIN_ID, LIST_END)).next).to.equal(ADDRESS_TWO)
      expect((await shoyuBashi.adapters(DOMAIN_ID, LIST_END)).previous).to.equal(ADDRESS_THREE)
      expect((await shoyuBashi.adapters(DOMAIN_ID, ADDRESS_TWO)).next).to.equal(ADDRESS_THREE)
      expect((await shoyuBashi.adapters(DOMAIN_ID, ADDRESS_TWO)).previous).to.equal(LIST_END)
      expect((await shoyuBashi.adapters(DOMAIN_ID, ADDRESS_THREE)).next).to.equal(LIST_END)
      expect((await shoyuBashi.adapters(DOMAIN_ID, ADDRESS_THREE)).previous).to.equal(ADDRESS_TWO)
    })
    it("Emits AdaptersEnabled() event", async function () {
      const { shoyuBashi } = await setup()
      await expect(shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE]))
        .to.emit(shoyuBashi, "AdaptersEnabled")
        .withArgs(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
    })
  })

  describe("disableAdapters()", function () {
    it("Reverts if called by non-owner account", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.transferOwnership(shoyuBashi.address)
      await expect(shoyuBashi.disableAdapters(DOMAIN_ID, [ADDRESS_TWO])).to.be.revertedWith(
        "Ownable: caller is not the owner",
      )
    })
    it("Reverts if no adapters are enabled", async function () {
      const { shoyuBashi } = await setup()
      await expect(shoyuBashi.disableAdapters(DOMAIN_ID, [])).to.be.revertedWithCustomError(
        shoyuBashi,
        "NoAdaptersEnabled",
      )
    })
    it("Reverts if given an empty array", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO])
      await expect(shoyuBashi.disableAdapters(DOMAIN_ID, [])).to.be.revertedWithCustomError(
        shoyuBashi,
        "NoAdaptersGiven",
      )
    })
    it("Reverts if given adapter is Address(0)", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO])
      await expect(shoyuBashi.disableAdapters(DOMAIN_ID, [ADDRESS_ZERO])).to.be.revertedWithCustomError(
        shoyuBashi,
        "InvalidAdapter",
      )
    })
    it("Reverts if given adapter is Address(1) / LIST_END", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO])
      await expect(shoyuBashi.disableAdapters(DOMAIN_ID, [LIST_END])).to.be.revertedWithCustomError(
        shoyuBashi,
        "InvalidAdapter",
      )
    })
    it("Reverts if adapter is not enabled", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO])
      await expect(shoyuBashi.disableAdapters(DOMAIN_ID, [ADDRESS_THREE, ADDRESS_TWO])).to.be.revertedWithCustomError(
        shoyuBashi,
        "AdapterNotEnabled",
      )
    })
    it("Disables the given adapters", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await shoyuBashi.disableAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      const adapters = await shoyuBashi.getAdapters(DOMAIN_ID)
      await expect(adapters[0]).to.equal(undefined)
    })
    it("Emits AdaptersDisabled() event", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(shoyuBashi.disableAdapters(DOMAIN_ID, [ADDRESS_THREE, ADDRESS_TWO]))
        .to.emit(shoyuBashi, "AdaptersDisabled")
        .withArgs(DOMAIN_ID, [ADDRESS_THREE, ADDRESS_TWO])
    })
  })

  describe("getAdapters()", function () {
    it("Returns empty array if no adapters are enabled", async function () {
      const { shoyuBashi } = await setup()
      const adapters = await shoyuBashi.getAdapters(DOMAIN_ID)
      expect(adapters[0]).to.equal(undefined)
      await shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(shoyuBashi.disableAdapters(DOMAIN_ID, [ADDRESS_THREE, ADDRESS_TWO]))
      expect(adapters[0]).to.equal(undefined)
    })
    it("Returns array of enabled adapters", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      const adapters = await shoyuBashi.getAdapters(DOMAIN_ID)
      expect(adapters[0]).to.equal(ADDRESS_TWO)
      expect(adapters[1]).to.equal(ADDRESS_THREE)
    })
  })

  describe("getThresholdAndCount()", function () {
    it("Returns threshold equal to count if threshold not explicitly set", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      const [threshold, count] = await shoyuBashi.getThresholdAndCount(DOMAIN_ID)
      await expect(threshold).to.equal(count)
    })
    it("Returns threshold and count", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await shoyuBashi.setThreshold(DOMAIN_ID, 2)
      const [threshold] = await shoyuBashi.getThresholdAndCount(DOMAIN_ID)
      await expect(threshold).to.equal(2)
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
      const { shoyuBashi, mockAdapter } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [mockAdapter.address])
      await shoyuBashi.setThreshold(DOMAIN_ID, 2)
      await expect(shoyuBashi.getUnanimousHash(DOMAIN_ID, 1)).to.be.revertedWithCustomError(
        shoyuBashi,
        "ThresholdNotMet",
      )
    })
    it("Returns unanimous agreed on hash", async function () {
      const { shoyuBashi, mockAdapter, anotherAdapter } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [mockAdapter.address, anotherAdapter.address])
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
      const { shoyuBashi, mockAdapter, anotherAdapter } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [mockAdapter.address, anotherAdapter.address])
      await shoyuBashi.setThreshold(DOMAIN_ID, 3)
      await expect(shoyuBashi.getThresholdHash(DOMAIN_ID, 2)).to.be.revertedWithCustomError(
        shoyuBashi,
        "ThresholdNotMet",
      )
    })
    it("Reverts if threshold returns bytes(0)", async function () {
      const { shoyuBashi, mockAdapter, anotherAdapter } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [mockAdapter.address, anotherAdapter.address])
      await expect(shoyuBashi.getThresholdHash(DOMAIN_ID, 0)).to.be.revertedWithCustomError(
        shoyuBashi,
        "ThresholdNotMet",
      )
    })
    it("Returns unanimous agreed on hash", async function () {
      const { shoyuBashi, mockAdapter, anotherAdapter } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [mockAdapter.address, anotherAdapter.address])
      expect(await shoyuBashi.getThresholdHash(DOMAIN_ID, 1)).to.equal(HASH_GOOD)
    })
  })

  describe("getHash()", function () {
    it("Reverts if threshold is not met", async function () {
      const { shoyuBashi, mockAdapter } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [mockAdapter.address])
      await shoyuBashi.setThreshold(DOMAIN_ID, 2)
      await expect(shoyuBashi.getHash(DOMAIN_ID, 1, [mockAdapter.address])).to.be.revertedWithCustomError(
        shoyuBashi,
        "ThresholdNotMet",
      )
    })
    it("Reverts if given adapters are duplicate", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(shoyuBashi.getHash(DOMAIN_ID, 1, [ADDRESS_TWO, ADDRESS_TWO])).to.be.revertedWithCustomError(
        shoyuBashi,
        "DuplicateOrOutOfOrderAdapters",
      )
    })
    it("Reverts if given adapters are out of order", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(shoyuBashi.getHash(DOMAIN_ID, 1, [ADDRESS_THREE, ADDRESS_TWO])).to.be.revertedWithCustomError(
        shoyuBashi,
        "DuplicateOrOutOfOrderAdapters",
      )
    })
    it("Reverts if given adapter is not enabled", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO])
      await expect(shoyuBashi.getHash(DOMAIN_ID, 1, [ADDRESS_TWO, ADDRESS_THREE])).to.be.revertedWithCustomError(
        shoyuBashi,
        "InvalidAdapter",
      )
    })
    it("Reverts if no adapters are enabled", async function () {
      const { shoyuBashi } = await setup()
      await expect(shoyuBashi.getHash(DOMAIN_ID, 1, [ADDRESS_TWO, ADDRESS_THREE])).to.be.revertedWithCustomError(
        shoyuBashi,
        "NoAdaptersEnabled",
      )
    })
    it("Reverts if no adapters are given", async function () {
      const { shoyuBashi } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO])
      await expect(shoyuBashi.getHash(DOMAIN_ID, 1, [])).to.be.revertedWithCustomError(shoyuBashi, "NoAdaptersGiven")
    })
    it("Returns unanimous agreed on hash", async function () {
      const { shoyuBashi, mockAdapter, anotherAdapter } = await setup()
      await shoyuBashi.enableAdapters(DOMAIN_ID, [mockAdapter.address, anotherAdapter.address])
      let adapters
      if (anotherAdapter.address > mockAdapter.address) {
        adapters = [mockAdapter.address, anotherAdapter.address]
      } else {
        adapters = [anotherAdapter.address, mockAdapter.address]
      }
      expect(await shoyuBashi.getHash(DOMAIN_ID, 1, adapters)).to.equal(HASH_GOOD)
    })
  })
})
