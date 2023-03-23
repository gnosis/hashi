import { expect } from "chai"
import { ethers } from "hardhat"

const DOMAIN_ID = 1
const ID_ZERO = 0
const ID_ONE = 1
const ID_TWO = 2
const YAHO_ADD = "0x00000000000000000000000000000000000004a1"

const MESSAGE_1 = {
  to: "0x0000000000000000000000000000000000000001",
  toChainId: 1,
  data: 0x1111111111,
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
  const messageExecutor = await MessageExecutor.deploy(hashi.address, YAHO_ADD)
  const OracleAdapter = await ethers.getContractFactory("MockOracleAdapter")
  const oracleAdapter = await OracleAdapter.deploy()
  const Yaho = await ethers.getContractFactory("Yaho")
  const yaho = await Yaho.deploy()

  const hash_one = await yaho.calculateHash(ID_ZERO, YAHO_ADD, wallet.address, MESSAGE_1)
  const hash_two = await yaho.calculateHash(ID_ONE, YAHO_ADD, wallet.address, MESSAGE_2)
  const failMessage = {
    to: hashi.address,
    toChainId: 1,
    data: 0x1111111111,
  }
  const hash_fail = await yaho.calculateHash(ID_TWO, YAHO_ADD, wallet.address, failMessage)
  await oracleAdapter.setHashes(DOMAIN_ID, [ID_ZERO, ID_ONE, ID_TWO], [hash_one, hash_two, hash_fail])

  return {
    wallet,
    hashi,
    messageExecutor,
    oracleAdapter,
    yaho,
    hash_one,
    hash_two,
    failMessage,
    hash_fail,
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

    it("Sets yaho address", async function () {
      const { messageExecutor } = await setup()
      expect(await messageExecutor.yaho()).to.equal(YAHO_ADD)
    })
  })

  describe("calculateHash()", function () {
    it("calculates correct hash of the given message", async function () {
      const { messageExecutor, wallet, hash_one } = await setup()
      const calculatedHash = await messageExecutor.calculateHash(0, YAHO_ADD, wallet.address, MESSAGE_1)
      expect(calculatedHash).to.equal(hash_one)
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
    it("reverts if reported hash does not match calculated hash", async function () {
      const { messageExecutor, wallet, oracleAdapter } = await setup()
      await expect(
        messageExecutor.executeMessagesFromOracles([MESSAGE_1], [ID_ONE], [wallet.address], [oracleAdapter.address]),
      ).to.be.revertedWithCustomError(messageExecutor, "HashMismatch")
    })
    it("reverts if call fails", async function () {
      const { messageExecutor, wallet, oracleAdapter, failMessage } = await setup()
      await expect(
        messageExecutor.executeMessagesFromOracles([failMessage], [ID_TWO], [wallet.address], [oracleAdapter.address]),
      ).to.be.revertedWithCustomError(messageExecutor, "CallFailed")
    })
    it("executes messages")
    it("emits MessageIDExecuted")
    it("returns returnDatas from executedMessages")
    it("reverts if transaction was already executed")
  })
})
