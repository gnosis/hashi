import { expect } from "chai"
import { ethers } from "hardhat"

const ID_ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000"
const ID_ONE = "0x0000000000000000000000000000000000000000000000000000000000000001"
const ID_TWO = "0x0000000000000000000000000000000000000000000000000000000000000002"

const MESSAGE_1 = {
  to: "0x0000000000000000000000000000000000000001",
  toChainId: 1,
  data: 0x01,
}
const MESSAGE_2 = {
  to: "0x0000000000000000000000000000000000000002",
  toChainId: 2,
  data: 0x02,
}

const setup = async () => {
  const [wallet] = await ethers.getSigners()
  const Hashi = await ethers.getContractFactory("Hashi")
  const hashi = await Hashi.deploy()
  const MessageExecutor = await ethers.getContractFactory("MessageExecutor")
  const messageExecutor = await MessageExecutor.deploy(hashi.address)
  const OracleAdapter = await ethers.getContractFactory("MockOracleAdapter")
  const oracleAdapter = await OracleAdapter.deploy()

  return {
    wallet,
    hashi,
    messageExecutor,
    oracleAdapter,
  }
}

describe("MessageExecutor", function () {
  describe("constructor()", function () {
    it("Successfully deploys contract", async function () {
      const { messageExecutor } = await setup()
      expect(await messageExecutor.deployed())
    })

    it("Sets hashi address", async function () {
      const { messageExecutor, hashi } = await setup()
      expect(await messageExecutor.hashi()).to.equal(hashi.address)
    })
  })

  describe("executeMessagesFromOracles()", function () {
    it("reverts if messages, messageIds, or senders are unequal lengths", async function () {
      const { messageExecutor, wallet, oracleAdapter } = await setup()

      await expect(
        messageExecutor.executeMessagesFromOracles(
          [MESSAGE_1, MESSAGE_2],
          [ID_ZERO],
          [wallet.address, wallet.address],
          [oracleAdapter.address],
        ),
      )
        .to.be.revertedWithCustomError(messageExecutor, "UnequalArrayLengths")
        .withArgs(messageExecutor.address)
      await expect(
        messageExecutor.executeMessagesFromOracles(
          [MESSAGE_1],
          [ID_ZERO, ID_ONE],
          [wallet.address, wallet.address],
          [oracleAdapter.address],
        ),
      )
        .to.be.revertedWithCustomError(messageExecutor, "UnequalArrayLengths")
        .withArgs(messageExecutor.address)
      await expect(
        messageExecutor.executeMessagesFromOracles(
          [MESSAGE_1, MESSAGE_2],
          [ID_ZERO, ID_ONE],
          [wallet.address],
          [oracleAdapter.address],
        ),
      )
        .to.be.revertedWithCustomError(messageExecutor, "UnequalArrayLengths")
        .withArgs(messageExecutor.address)
    })
    it("reverts if reported hash does not match calculated hash")
    it("reverts if call fails")
    it("executes messages")
    it("emits MessageIDExecuted")
    it("returns returnDatas from executedMessages")
    it("reverts if transaction was already executed")
  })
})
