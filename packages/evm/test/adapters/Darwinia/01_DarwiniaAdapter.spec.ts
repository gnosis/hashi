import { expect } from "chai"
import { ethers, network } from "hardhat"

const DOMAIN_ID = "0x0000000000000000000000000000000000000000000000000000000000000001"
const ID_ZERO = 0
const ID_ONE = 1
const HASH_ONE = "0x0000000000000000000000000000000000000000000000000000000000000001"
const HASH_ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000"

const setup = async () => {
  await network.provider.request({ method: "hardhat_reset", params: [] })
  const [wallet] = await ethers.getSigners()
  const MockDarwiniaRouter = await ethers.getContractFactory("MockDarwiniaRouter")
  const router = await MockDarwiniaRouter.deploy()
  const DarwiniaAdapter = await ethers.getContractFactory("DarwiniaAdapter")
  const adapter = await DarwiniaAdapter.deploy(router.address)
  return {
    wallet,
    router,
    adapter,
  }
}

describe("DarwiniaAdapter", function () {
  describe("Constructor", function () {
    it("Successfully deploys contract with correct state", async function () {
      const { wallet, router, adapter } = await setup()
      expect(await adapter.deployed())
      expect(await adapter.router()).to.equal(router.address)
    })
  })

  describe("StoreBlockHeader()", function () {
    it("StoreBlockHeader", async function () {
      const { adapter } = await setup()
      await adapter.storeBlockHeader(DOMAIN_ID, ID_ONE)
      expect(await adapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ONE)
    })
  })

  describe("GetHashFromOracle()", function () {
    it("Returns 0 if no header is stored", async function () {
      const { adapter } = await setup()
      expect(await adapter.getHashFromOracle(DOMAIN_ID, ID_ZERO)).to.equal(HASH_ZERO)
    })
  })
})
