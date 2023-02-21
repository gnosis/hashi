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
  const GiriGiriBashi = await ethers.getContractFactory("GiriGiriBashi")
  const giriGiriBashi = await GiriGiriBashi.deploy(wallet.address, hashi.address)
  const MockOracleAdapter = await ethers.getContractFactory("MockOracleAdapter")
  const mockOracleAdapter = await MockOracleAdapter.deploy()
  const anotherOracleAdapter = await MockOracleAdapter.deploy()

  await mockOracleAdapter.setBlockHeaders(CHAIN_ID, [0, 1], [HEADER_ZERO, HEADER_GOOD])
  await anotherOracleAdapter.setBlockHeaders(CHAIN_ID, [0, 1], [HEADER_ZERO, HEADER_GOOD])
  await giriGiriBashi.setThreshold(CHAIN_ID, 2)

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
      await expect(giriGiriBashi.setThreshold(CHAIN_ID, 2)).to.be.revertedWith("Ownable: caller is not the owner")
    })
    it("Reverts if hashi is already set to this address", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.setThreshold(CHAIN_ID, 2)).to.be.revertedWithCustomError(
        giriGiriBashi,
        "DuplicateThreashold",
      )
    })
    it("Sets threshold for the given ChainID", async function () {
      const { giriGiriBashi } = await setup()
      expect(await giriGiriBashi.setThreshold(CHAIN_ID, 3))
      expect((await giriGiriBashi.chains(CHAIN_ID)).threshold).to.equal(3)
    })
    it("Emits HashiSet() event", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.setThreshold(CHAIN_ID, 3))
        .to.emit(giriGiriBashi, "ThresholdSet")
        .withArgs(giriGiriBashi.address, CHAIN_ID, 3)
    })
  })
  describe("enableOracleAdapters()", function () {
    it("Reverts if called by non-owner account", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.transferOwnership(giriGiriBashi.address)
      await expect(giriGiriBashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO])).to.be.revertedWith(
        "Ownable: caller is not the owner",
      )
    })
    it("Reverts if given an empty array", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.enableOracleAdapters(CHAIN_ID, [])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "NoAdaptersGiven",
      )
    })
    it("Reverts if given oracle adapter is Address(0)", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_ZERO])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "InvalidAdapter",
      )
    })
    it("Reverts if given oracle adapter is Address(1) / LIST_END", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.enableOracleAdapters(CHAIN_ID, [LIST_END])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "InvalidAdapter",
      )
    })
    // it("Reverts if given oracle adapters are duplicate", async function () {
    //   const { giriGiriBashi, mockOracleAdapter } = await setup()
    //   await expect(
    //     giriGiriBashi.enableOracleAdapters(CHAIN_ID, [mockOracleAdapter.address, mockOracleAdapter.address]),
    //   ).to.be.revertedWithCustomError(giriGiriBashi, "DuplicateOrOutOfOrderAdapters")
    // })
    // it("Reverts if given oracle adapters are out of order", async function () {
    //   const { giriGiriBashi } = await setup()
    //   await expect(
    //     giriGiriBashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_THREE, ADDRESS_TWO]),
    //   ).to.be.revertedWithCustomError(giriGiriBashi, "DuplicateOrOutOfOrderAdapters")
    // })
    it("Reverts if adapter is already enabled", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO]))
      await expect(giriGiriBashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "AdapterAlreadyEnabled",
      )
    })
    it("Enables the given oracles", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE]))
      const adapters = await giriGiriBashi.getOracleAdapters(CHAIN_ID)
      await expect(adapters[0]).to.equal(ADDRESS_TWO)
      await expect(adapters[1]).to.equal(ADDRESS_THREE)
      expect((await giriGiriBashi.adapters(CHAIN_ID, LIST_END)).next).to.equal(ADDRESS_TWO)
      expect((await giriGiriBashi.adapters(CHAIN_ID, LIST_END)).previous).to.equal(ADDRESS_THREE)
      expect((await giriGiriBashi.adapters(CHAIN_ID, ADDRESS_TWO)).next).to.equal(ADDRESS_THREE)
      expect((await giriGiriBashi.adapters(CHAIN_ID, ADDRESS_TWO)).previous).to.equal(LIST_END)
      expect((await giriGiriBashi.adapters(CHAIN_ID, ADDRESS_THREE)).next).to.equal(LIST_END)
      expect((await giriGiriBashi.adapters(CHAIN_ID, ADDRESS_THREE)).previous).to.equal(ADDRESS_TWO)
    })
    it("Emits OracleAdaptersEnabled() event", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE]))
        .to.emit(giriGiriBashi, "OracleAdaptersEnabled")
        .withArgs(giriGiriBashi.address, CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
    })
  })
  describe("OracleAdaptersDisabled()", function () {
    it("Reverts if called by non-owner account", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.transferOwnership(giriGiriBashi.address)
      await expect(giriGiriBashi.disableOracleAdapters(CHAIN_ID, [ADDRESS_TWO])).to.be.revertedWith(
        "Ownable: caller is not the owner",
      )
    })
    it("Reverts if no adapters are enabled", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.disableOracleAdapters(CHAIN_ID, [])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "NoAdaptersEnabled",
      )
    })
    it("Reverts if given an empty array", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO])
      await expect(giriGiriBashi.disableOracleAdapters(CHAIN_ID, [])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "NoAdaptersGiven",
      )
    })
    it("Reverts if given oracle adapter is Address(0)", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO])
      await expect(giriGiriBashi.disableOracleAdapters(CHAIN_ID, [ADDRESS_ZERO])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "InvalidAdapter",
      )
    })
    it("Reverts if given oracle adapter is Address(1) / LIST_END", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO])
      await expect(giriGiriBashi.disableOracleAdapters(CHAIN_ID, [LIST_END])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "InvalidAdapter",
      )
    })
    // it("Reverts if given oracle adapters are duplicate", async function () {
    //   const { giriGiriBashi } = await setup()
    //   await giriGiriBashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO])
    //   await expect(
    //     giriGiriBashi.disableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_TWO]),
    //   ).to.be.revertedWithCustomError(giriGiriBashi, "DuplicateOrOutOfOrderAdapters")
    // })
    // it("Reverts if given oracle adapters are out of order", async function () {
    //   const { giriGiriBashi } = await setup()
    //   await giriGiriBashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
    //   await expect(
    //     giriGiriBashi.disableOracleAdapters(CHAIN_ID, [ADDRESS_THREE, ADDRESS_TWO]),
    //   ).to.be.revertedWithCustomError(giriGiriBashi, "DuplicateOrOutOfOrderAdapters")
    // })
    it("Reverts if adapter is not enabled", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO])
      await expect(
        giriGiriBashi.disableOracleAdapters(CHAIN_ID, [ADDRESS_THREE, ADDRESS_TWO]),
      ).to.be.revertedWithCustomError(giriGiriBashi, "AdapterNotEnabled")
    })
    it("Disables the given oracles", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await giriGiriBashi.disableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      const adapters = await giriGiriBashi.getOracleAdapters(CHAIN_ID)
      await expect(adapters[0]).to.equal(undefined)
    })
    it("Emits OracleAdaptersDisabled() event", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(giriGiriBashi.disableOracleAdapters(CHAIN_ID, [ADDRESS_THREE, ADDRESS_TWO]))
        .to.emit(giriGiriBashi, "OracleAdaptersDisabled")
        .withArgs(giriGiriBashi.address, CHAIN_ID, [ADDRESS_THREE, ADDRESS_TWO])
    })
  })
  describe("getOracleAdapters()", function () {
    it("Returns empty array if no adapters are enabled", async function () {
      const { giriGiriBashi } = await setup()
      const adapters = await giriGiriBashi.getOracleAdapters(CHAIN_ID)
      expect(adapters[0]).to.equal(undefined)
      await giriGiriBashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(giriGiriBashi.disableOracleAdapters(CHAIN_ID, [ADDRESS_THREE, ADDRESS_TWO]))
      expect(adapters[0]).to.equal(undefined)
    })
    it("Returns array of enabled adapters", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      const adapters = await giriGiriBashi.getOracleAdapters(CHAIN_ID)
      expect(adapters[0]).to.equal(ADDRESS_TWO)
      expect(adapters[1]).to.equal(ADDRESS_THREE)
    })
  })
  describe("getUnanimousHeader()", function () {
    it("Reverts if no adapters are enabled", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.getUnanimousHeader(CHAIN_ID, 1)).to.be.revertedWithCustomError(
        giriGiriBashi,
        "NoAdaptersEnabled",
      )
    })
    it("Reverts if threshold is not met", async function () {
      const { giriGiriBashi, mockOracleAdapter } = await setup()
      await giriGiriBashi.enableOracleAdapters(CHAIN_ID, [mockOracleAdapter.address])
      await expect(giriGiriBashi.getUnanimousHeader(CHAIN_ID, 1)).to.be.revertedWithCustomError(
        giriGiriBashi,
        "ThresholdNotMet",
      )
    })
    it("Returns unanimous agreed on header", async function () {
      const { giriGiriBashi, mockOracleAdapter, anotherOracleAdapter } = await setup()
      await giriGiriBashi.enableOracleAdapters(CHAIN_ID, [mockOracleAdapter.address, anotherOracleAdapter.address])
      expect(await giriGiriBashi.getUnanimousHeader(CHAIN_ID, 1)).to.equal(HEADER_GOOD)
    })
  })
  describe("getHeader()", function () {
    it("Reverts if threshold is not met", async function () {
      const { giriGiriBashi, mockOracleAdapter } = await setup()
      await giriGiriBashi.enableOracleAdapters(CHAIN_ID, [mockOracleAdapter.address])
      await expect(giriGiriBashi.getHeader(CHAIN_ID, 1, [mockOracleAdapter.address])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "ThresholdNotMet",
      )
    })
    it("Reverts if given oracle adapters are duplicate", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(giriGiriBashi.getHeader(CHAIN_ID, 1, [ADDRESS_TWO, ADDRESS_TWO])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "DuplicateOrOutOfOrderAdapters",
      )
    })
    it("Reverts if given oracle adapters are out of order", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      await expect(giriGiriBashi.getHeader(CHAIN_ID, 1, [ADDRESS_THREE, ADDRESS_TWO])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "DuplicateOrOutOfOrderAdapters",
      )
    })
    it("Reverts if given oracle adapter is not enabled", async function () {
      const { giriGiriBashi } = await setup()
      await giriGiriBashi.enableOracleAdapters(CHAIN_ID, [ADDRESS_TWO])
      await expect(giriGiriBashi.getHeader(CHAIN_ID, 1, [ADDRESS_TWO, ADDRESS_THREE])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "InvalidAdapter",
      )
    })
    it("Returns unanimous agreed on header", async function () {
      const { giriGiriBashi, mockOracleAdapter, anotherOracleAdapter } = await setup()
      await giriGiriBashi.enableOracleAdapters(CHAIN_ID, [mockOracleAdapter.address, anotherOracleAdapter.address])
      expect(
        await giriGiriBashi.getHeader(CHAIN_ID, 1, [mockOracleAdapter.address, anotherOracleAdapter.address]),
      ).to.equal(HEADER_GOOD)
    })
  })
})
