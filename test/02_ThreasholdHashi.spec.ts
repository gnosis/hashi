import { expect } from "chai"
import { ethers } from "hardhat"

const CHAIN_ID = 1
const HEADER_ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000"
const HEADER_GOOD = "0x0000000000000000000000000000000000000000000000000000000000000001"
const HEADER_BAD = "0x0000000000000000000000000000000000000000000000000000000000000bad"
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000"
const LIST_END = "0x0000000000000000000000000000000000000001"
const ADDRESS_TWO = "0x0000000000000000000000000000000000000002"
const ADDRESS_THREE = "0x0000000000000000000000000000000000000003"

const setup = async () => {
  const [wallet] = await ethers.getSigners()
  const Hashi = await ethers.getContractFactory("Hashi")
  const hashi = await Hashi.deploy()
  const ThresholdHashi = await ethers.getContractFactory("ThresholdHashi")
  const thresholdHashi = await ThresholdHashi.deploy(wallet.address, hashi.address)
  const MockOracleAdapter = await ethers.getContractFactory("MockOracleAdapter")
  const mockOracleAdapter = await MockOracleAdapter.deploy()
  const anotherOracleAdapter = await MockOracleAdapter.deploy()

  await mockOracleAdapter.setBlockHeaders(CHAIN_ID, [0, 1], [HEADER_ZERO, HEADER_GOOD])
  await anotherOracleAdapter.setBlockHeaders(CHAIN_ID, [0, 1], [HEADER_ZERO, HEADER_GOOD])
  await thresholdHashi.setThreshold(CHAIN_ID, 2)

  return {
    wallet,
    hashi,
    ThresholdHashi,
    thresholdHashi,
    mockOracleAdapter,
    anotherOracleAdapter,
  }
}

describe("ThresholdHashi", function () {
  describe("Deploy", function () {
    it("Successfully deploys contract", async function () {
      const { hashi, thresholdHashi, wallet } = await setup()
      expect(await thresholdHashi.deployed())
      expect(await thresholdHashi.owner()).to.equal(wallet.address)
      expect(await thresholdHashi.hashi()).to.equal(hashi.address)
    })
    it("Emits Initialized event", async function () {
      const { thresholdHashi } = await setup()
      const event = await thresholdHashi.filters.Init(null, null)
      await expect(event.address).to.equal(thresholdHashi.address)
    })
  })
  describe("setHashi()", function () {
    it("Reverts if called by non-owner account", async function () {
      const { thresholdHashi, wallet } = await setup()
      await thresholdHashi.transferOwnership(thresholdHashi.address)
      await expect(thresholdHashi.setHashi(wallet.address)).to.be.revertedWith("Ownable: caller is not the owner")
    })
    it("Reverts if hashi is already set to this address", async function () {
      const { hashi, thresholdHashi } = await setup()
      await expect(thresholdHashi.setHashi(hashi.address)).to.be.revertedWithCustomError(
        thresholdHashi,
        "DuplicateHashiAddress",
      )
    })
    it("Sets Hashi address", async function () {
      const { thresholdHashi, wallet } = await setup()
      await thresholdHashi.setHashi(wallet.address)
      expect(await thresholdHashi.hashi()).to.equal(wallet.address)
    })
    it("Emits HashiSet() event", async function () {
      const { thresholdHashi, wallet } = await setup()
      await expect(thresholdHashi.setHashi(wallet.address))
        .to.emit(thresholdHashi, "HashiSet")
        .withArgs(thresholdHashi.address, wallet.address)
    })
  })
  describe("setThreshold()", function () {
    it("Reverts if called by non-owner account", async function () {
      const { thresholdHashi } = await setup()
      await thresholdHashi.transferOwnership(thresholdHashi.address)
      await expect(thresholdHashi.setThreshold(CHAIN_ID, 2)).to.be.revertedWith("Ownable: caller is not the owner")
    })
    it("Reverts if hashi is already set to this address", async function () {
      const { thresholdHashi } = await setup()
      await expect(thresholdHashi.setThreshold(CHAIN_ID, 2)).to.be.revertedWithCustomError(
        thresholdHashi,
        "DuplicateThreashold",
      )
    })
    it("Sets threshold for the given ChainID", async function () {
      const { thresholdHashi } = await setup()
      expect(await thresholdHashi.setThreshold(CHAIN_ID, 3))
      expect((await thresholdHashi.chains(CHAIN_ID)).threshold).to.equal(3)
    })
    it("Emits HashiSet() event", async function () {
      const { thresholdHashi } = await setup()
      await expect(thresholdHashi.setThreshold(CHAIN_ID, 3))
        .to.emit(thresholdHashi, "ThresholdSet")
        .withArgs(thresholdHashi.address, CHAIN_ID, 3)
    })
  })
  describe("enableOracleAdapters()", function () {
    it("Reverts if called by non-owner account", async function () {
      const { thresholdHashi } = await setup()
      await thresholdHashi.transferOwnership(thresholdHashi.address)
      await expect(thresholdHashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO])).to.be.revertedWith(
        "Ownable: caller is not the owner",
      )
    })
    it("Reverts if given an empty array", async function () {
      const { thresholdHashi } = await setup()
      await expect(thresholdHashi.enableOracleAdapters(CHAIN_ID, [])).to.be.revertedWithCustomError(
        thresholdHashi,
        "NoAdaptersGiven",
      )
    })
    it("Reverts if given oracle adapter is Address(0)", async function () {
      const { thresholdHashi } = await setup()
      await expect(thresholdHashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_ZERO])).to.be.revertedWithCustomError(
        thresholdHashi,
        "InvalidAdapter",
      )
    })
    it("Reverts if given oracle adapter is Address(1) / LIST_END", async function () {
      const { thresholdHashi } = await setup()
      await expect(thresholdHashi.enableOracleAdapters(CHAIN_ID, [LIST_END])).to.be.revertedWithCustomError(
        thresholdHashi,
        "InvalidAdapter",
      )
    })
    // it("Reverts if given oracle adapters are duplicate", async function () {
    //   const { thresholdHashi, mockOracleAdapter } = await setup()
    //   await expect(
    //     thresholdHashi.enableOracleAdapters(CHAIN_ID, [mockOracleAdapter.address, mockOracleAdapter.address]),
    //   ).to.be.revertedWithCustomError(thresholdHashi, "DuplicateOrOutOfOrderAdapters")
    // })
    // it("Reverts if given oracle adapters are out of order", async function () {
    //   const { thresholdHashi } = await setup()
    //   await expect(
    //     thresholdHashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_THREE, ADDRESS_TWO]),
    //   ).to.be.revertedWithCustomError(thresholdHashi, "DuplicateOrOutOfOrderAdapters")
    // })
    it("Reverts if adapter is already enabled", async function () {
      const { thresholdHashi } = await setup()
      await expect(thresholdHashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO]))
      await expect(thresholdHashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO])).to.be.revertedWithCustomError(
        thresholdHashi,
        "AdapterAlreadyEnabled",
      )
    })
    it("Enables the given oracles", async function () {
      const { thresholdHashi } = await setup()
      await expect(thresholdHashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE]))
      const adapters = await thresholdHashi.getOracleAdapters(CHAIN_ID)
      await expect(adapters[0]).to.equal(ADDRESS_TWO)
      await expect(adapters[1]).to.equal(ADDRESS_THREE)
      expect((await thresholdHashi.adapters(CHAIN_ID, LIST_END)).next).to.equal(ADDRESS_TWO)
      expect((await thresholdHashi.adapters(CHAIN_ID, LIST_END)).previous).to.equal(ADDRESS_THREE)
      expect((await thresholdHashi.adapters(CHAIN_ID, ADDRESS_TWO)).next).to.equal(ADDRESS_THREE)
      expect((await thresholdHashi.adapters(CHAIN_ID, ADDRESS_TWO)).previous).to.equal(LIST_END)
      expect((await thresholdHashi.adapters(CHAIN_ID, ADDRESS_THREE)).next).to.equal(LIST_END)
      expect((await thresholdHashi.adapters(CHAIN_ID, ADDRESS_THREE)).previous).to.equal(ADDRESS_TWO)
    })
    it("Emits OracleAdaptersEnabled() event", async function () {
      const { thresholdHashi } = await setup()
      await expect(thresholdHashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE]))
        .to.emit(thresholdHashi, "OracleAdaptersEnabled")
        .withArgs(thresholdHashi.address, CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
    })
  })
  describe("OracleAdaptersDisabled()", function () {
    it("Reverts if called by non-owner account", async function () {
      const { thresholdHashi } = await setup()
      await thresholdHashi.transferOwnership(thresholdHashi.address)
      await expect(thresholdHashi.disableOracleAdapters(CHAIN_ID, [ADDRESS_TWO])).to.be.revertedWith(
        "Ownable: caller is not the owner",
      )
    })
    it("Reverts if no adapters are enabled", async function () {
      const { thresholdHashi } = await setup()
      await expect(thresholdHashi.disableOracleAdapters(CHAIN_ID, [])).to.be.revertedWithCustomError(
        thresholdHashi,
        "NoAdaptersEnabled",
      )
    })
    it("Reverts if given an empty array", async function () {
      const { thresholdHashi } = await setup()
      await thresholdHashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO])
      await expect(thresholdHashi.disableOracleAdapters(CHAIN_ID, [])).to.be.revertedWithCustomError(
        thresholdHashi,
        "NoAdaptersGiven",
      )
    })
    it("Reverts if given oracle adapter is Address(0)", async function () {
      const { thresholdHashi } = await setup()
      await thresholdHashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO])
      await expect(thresholdHashi.disableOracleAdapters(CHAIN_ID, [ADDRESS_ZERO])).to.be.revertedWithCustomError(
        thresholdHashi,
        "InvalidAdapter",
      )
    })
    it("Reverts if given oracle adapter is Address(1) / LIST_END", async function () {
      const { thresholdHashi } = await setup()
      await thresholdHashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO])
      await expect(thresholdHashi.disableOracleAdapters(CHAIN_ID, [LIST_END])).to.be.revertedWithCustomError(
        thresholdHashi,
        "InvalidAdapter",
      )
    })
    // it("Reverts if given oracle adapters are duplicate", async function () {
    //   const { thresholdHashi } = await setup()
    //   await thresholdHashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO])
    //   await expect(
    //     thresholdHashi.disableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_TWO]),
    //   ).to.be.revertedWithCustomError(thresholdHashi, "DuplicateOrOutOfOrderAdapters")
    // })
    // it("Reverts if given oracle adapters are out of order", async function () {
    //   const { thresholdHashi } = await setup()
    //   await thresholdHashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
    //   await expect(
    //     thresholdHashi.disableOracleAdapters(CHAIN_ID, [ADDRESS_THREE, ADDRESS_TWO]),
    //   ).to.be.revertedWithCustomError(thresholdHashi, "DuplicateOrOutOfOrderAdapters")
    // })
    it("Reverts if adapter is not enabled", async function () {
      const { thresholdHashi } = await setup()
      await thresholdHashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO])
      await expect(
        thresholdHashi.disableOracleAdapters(CHAIN_ID, [ADDRESS_THREE, ADDRESS_TWO]),
      ).to.be.revertedWithCustomError(thresholdHashi, "AdapterNotEnabled")
    })
    it("Disables the given oracles", async function () {
      const { thresholdHashi } = await setup()
      await thresholdHashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await thresholdHashi.disableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      const adapters = await thresholdHashi.getOracleAdapters(CHAIN_ID)
      await expect(adapters[0]).to.equal(undefined)
    })
    it("Emits OracleAdaptersDisabled() event", async function () {
      const { thresholdHashi } = await setup()
      await thresholdHashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(thresholdHashi.disableOracleAdapters(CHAIN_ID, [ADDRESS_THREE, ADDRESS_TWO]))
        .to.emit(thresholdHashi, "OracleAdaptersDisabled")
        .withArgs(thresholdHashi.address, CHAIN_ID, [ADDRESS_THREE, ADDRESS_TWO])
    })
  })
  describe("getOracleAdapters()", function () {
    it("Returns empty array if no adapters are enabled", async function () {
      const { thresholdHashi } = await setup()
      const adapters = await thresholdHashi.getOracleAdapters(CHAIN_ID)
      expect(adapters[0]).to.equal(undefined)
      await thresholdHashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(thresholdHashi.disableOracleAdapters(CHAIN_ID, [ADDRESS_THREE, ADDRESS_TWO]))
      expect(adapters[0]).to.equal(undefined)
    })
    it("Returns array of enabled adapters", async function () {
      const { thresholdHashi } = await setup()
      await thresholdHashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      const adapters = await thresholdHashi.getOracleAdapters(CHAIN_ID)
      expect(adapters[0]).to.equal(ADDRESS_TWO)
      expect(adapters[1]).to.equal(ADDRESS_THREE)
    })
  })
  describe("getUnanimousHeader()", function () {
    it("Reverts if no adapters are enabled", async function () {
      const { thresholdHashi } = await setup()
      await expect(thresholdHashi.getUnanimousHeader(CHAIN_ID, 1)).to.be.revertedWithCustomError(
        thresholdHashi,
        "NoAdaptersEnabled",
      )
    })
    it("Reverts if threshold is not met", async function () {
      const { thresholdHashi, mockOracleAdapter } = await setup()
      await thresholdHashi.enableOracleAdapters(CHAIN_ID, [mockOracleAdapter.address])
      await expect(thresholdHashi.getUnanimousHeader(CHAIN_ID, 1)).to.be.revertedWithCustomError(
        thresholdHashi,
        "ThresholdNotMet",
      )
    })
    it("Returns unanimous agreed on header", async function () {
      const { thresholdHashi, mockOracleAdapter, anotherOracleAdapter } = await setup()
      await thresholdHashi.enableOracleAdapters(CHAIN_ID, [mockOracleAdapter.address, anotherOracleAdapter.address])
      expect(await thresholdHashi.getUnanimousHeader(CHAIN_ID, 1)).to.equal(HEADER_GOOD)
    })
  })
  describe("getHeader()", function () {
    it("Reverts if threshold is not met", async function () {
      const { thresholdHashi, mockOracleAdapter } = await setup()
      await thresholdHashi.enableOracleAdapters(CHAIN_ID, [mockOracleAdapter.address])
      await expect(thresholdHashi.getHeader(CHAIN_ID, 1, [mockOracleAdapter.address])).to.be.revertedWithCustomError(
        thresholdHashi,
        "ThresholdNotMet",
      )
    })
    it("Reverts if given oracle adapters are duplicate", async function () {
      const { thresholdHashi } = await setup()
      await thresholdHashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(thresholdHashi.getHeader(CHAIN_ID, 1, [ADDRESS_TWO, ADDRESS_TWO])).to.be.revertedWithCustomError(
        thresholdHashi,
        "DuplicateOrOutOfOrderAdapters",
      )
    })
    it("Reverts if given oracle adapters are out of order", async function () {
      const { thresholdHashi } = await setup()
      await thresholdHashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(thresholdHashi.getHeader(CHAIN_ID, 1, [ADDRESS_THREE, ADDRESS_TWO])).to.be.revertedWithCustomError(
        thresholdHashi,
        "DuplicateOrOutOfOrderAdapters",
      )
    })
    it("Reverts if given oracle adapter is not enabled", async function () {
      const { thresholdHashi } = await setup()
      await thresholdHashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO])
      await expect(thresholdHashi.getHeader(CHAIN_ID, 1, [ADDRESS_TWO, ADDRESS_THREE])).to.be.revertedWithCustomError(
        thresholdHashi,
        "InvalidAdapter",
      )
    })
    it("Returns unanimous agreed on header", async function () {
      const { thresholdHashi, mockOracleAdapter, anotherOracleAdapter } = await setup()
      await thresholdHashi.enableOracleAdapters(CHAIN_ID, [mockOracleAdapter.address, anotherOracleAdapter.address])
      expect(
        await thresholdHashi.getHeader(CHAIN_ID, 1, [mockOracleAdapter.address, anotherOracleAdapter.address]),
      ).to.equal(HEADER_GOOD)
    })
  })
})
