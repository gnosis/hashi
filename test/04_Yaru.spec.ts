import { expect } from "chai"
import { ethers, network } from "hardhat"

const DOMAIN_ID = network.config.chainId
const ID_ZERO = 0
const ID_ONE = 1
const ID_TWO = 2

const setup = async () => {
  const [wallet] = await ethers.getSigners()
  const Hashi = await ethers.getContractFactory("Hashi")
  const hashi = await Hashi.deploy()
  const Yaru = await ethers.getContractFactory("Yaru")
  const Yaho = await ethers.getContractFactory("Yaho")
  const yaho = await Yaho.deploy()
  const yaru = await Yaru.deploy(hashi.address, yaho.address, DOMAIN_ID)
  const OracleAdapter = await ethers.getContractFactory("MockOracleAdapter")
  const oracleAdapter = await OracleAdapter.deploy()
  const PingPong = await ethers.getContractFactory("PingPong")
  const pingPong = await PingPong.deploy()

  const message_1 = {
    to: pingPong.address,
    toChainId: DOMAIN_ID,
    data: pingPong.interface.getSighash("ping"),
  }
  const message_2 = {
    to: "0x0000000000000000000000000000000000000002",
    toChainId: DOMAIN_ID,
    data: 0x02,
  }
  const hash_one = await yaho.calculateHash(DOMAIN_ID, ID_ZERO, yaho.address, wallet.address, message_1)
  const hash_two = await yaho.calculateHash(DOMAIN_ID, ID_ONE, yaho.address, wallet.address, message_2)
  const failMessage = {
    to: hashi.address,
    toChainId: 1,
    data: 0x1111111111,
  }
  const hash_fail = await yaho.calculateHash(DOMAIN_ID, ID_TWO, yaho.address, wallet.address, failMessage)
  await oracleAdapter.setHashes(DOMAIN_ID, [ID_ZERO, ID_ONE, ID_TWO], [hash_one, hash_two, hash_fail])

  return {
    wallet,
    hashi,
    yaru,
    oracleAdapter,
    yaho,
    hash_one,
    hash_two,
    failMessage,
    hash_fail,
    pingPong,
    message_1,
    message_2,
  }
}

describe("Yaru", function () {
  describe("constructor()", function () {
    it("Successfully deploys contract", async function () {
      const { yaru } = await setup()
      expect(await yaru.deployed())
    })

    it("Sets hashi address", async function () {
      const { yaru, hashi } = await setup()
      expect(await yaru.hashi()).to.equal(hashi.address)
    })

    it("Sets yaho address", async function () {
      const { yaru, yaho } = await setup()
      expect(await yaru.yaho()).to.equal(yaho.address)
    })
  })

  describe("calculateHash()", function () {
    it("calculates correct hash of the given message", async function () {
      const { yaru, wallet, hash_one, message_1, yaho } = await setup()
      const calculatedHash = await yaru.calculateHash(DOMAIN_ID, 0, yaho.address, wallet.address, message_1)
      expect(calculatedHash).to.equal(hash_one)
    })
  })

  describe("executeMessages()", function () {
    it("reverts if messages, messageIds, or senders are unequal lengths", async function () {
      const { yaru, wallet, oracleAdapter, message_1, message_2 } = await setup()

      await expect(
        yaru.executeMessages(
          [message_1, message_2],
          [ID_ZERO],
          [wallet.address, wallet.address],
          [oracleAdapter.address],
        ),
      )
        .to.be.revertedWithCustomError(yaru, "UnequalArrayLengths")
        .withArgs(yaru.address)
      await expect(
        yaru.executeMessages([message_1], [ID_ZERO, ID_ONE], [wallet.address, wallet.address], [oracleAdapter.address]),
      )
        .to.be.revertedWithCustomError(yaru, "UnequalArrayLengths")
        .withArgs(yaru.address)
      await expect(
        yaru.executeMessages([message_1, message_2], [ID_ZERO, ID_ONE], [wallet.address], [oracleAdapter.address]),
      )
        .to.be.revertedWithCustomError(yaru, "UnequalArrayLengths")
        .withArgs(yaru.address)
    })
    it("reverts if reported hash does not match calculated hash", async function () {
      const { yaru, wallet, oracleAdapter, message_1, message_2 } = await setup()
      await expect(
        yaru.executeMessages(
          [message_1, message_2],
          [ID_ZERO, ID_TWO],
          [wallet.address, wallet.address],
          [oracleAdapter.address],
        ),
      ).to.be.revertedWithCustomError(yaru, "HashMismatch")
      await expect(
        yaru.executeMessages([message_1], [ID_TWO], [wallet.address], [oracleAdapter.address]),
      ).to.be.revertedWithCustomError(yaru, "HashMismatch")
    })
    it("reverts if call fails", async function () {
      const { yaru, wallet, oracleAdapter, failMessage } = await setup()
      await expect(
        yaru.executeMessages([failMessage], [ID_TWO], [wallet.address], [oracleAdapter.address]),
      ).to.be.revertedWithCustomError(yaru, "CallFailed")
    })
    it("executes a message", async function () {
      const { yaru, wallet, oracleAdapter, message_1, message_2 } = await setup()

      expect(await yaru.executeMessages([message_1], [ID_ZERO], [wallet.address], [oracleAdapter.address]))
    })
    it("executes multiple messages", async function () {
      const { yaru, wallet, oracleAdapter, message_1, message_2 } = await setup()
      expect(
        await yaru.executeMessages(
          [message_1, message_2],
          [ID_ZERO, ID_ONE],
          [wallet.address, wallet.address],
          [oracleAdapter.address],
        ),
      )
    })
    it("reverts if transaction was already executed", async function () {
      const { yaru, wallet, oracleAdapter, message_1 } = await setup()

      await expect(yaru.executeMessages([message_1], [ID_ZERO], [wallet.address], [oracleAdapter.address]))
      await expect(
        yaru.executeMessages([message_1], [ID_ZERO], [wallet.address], [oracleAdapter.address]),
      ).to.be.revertedWithCustomError(yaru, "AlreadyExecuted")
    })
    it("emits MessageIDExecuted", async function () {
      const { yaru, wallet, oracleAdapter, message_1 } = await setup()

      await expect(yaru.executeMessages([message_1], [ID_ZERO], [wallet.address], [oracleAdapter.address]))
        .to.emit(yaru, "MessageIdExecuted")
        .withArgs(DOMAIN_ID, "0x0000000000000000000000000000000000000000000000000000000000000000")
    })
    it("returns returnDatas[] from executedMessages", async function () {
      const { yaru, wallet, oracleAdapter, message_1 } = await setup()

      const response = await yaru.callStatic.executeMessages(
        [message_1],
        [ID_ZERO],
        [wallet.address],
        [oracleAdapter.address],
      )
      const output = await ethers.utils.defaultAbiCoder.decode(["string"], response[0])

      expect(output[0]).to.equal("pong")
    })
  })
})
