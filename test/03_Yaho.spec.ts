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
  const Yaho = await ethers.getContractFactory("Yaho")
  const yaho = await Yaho.deploy()
  const MessageRelay = await ethers.getContractFactory("MockMessageRelay")
  const messageRelay = await MessageRelay.deploy()

  return {
    wallet,
    yaho,
    messageRelay,
  }
}

describe("Yaho", function () {
  describe("Deploy", function () {
    it("Successfully deploys contract", async function () {
      const { yaho } = await setup()
      expect(await yaho.deployed())
    })
  })

  describe("dispatchMessages()", function () {
    it("reverts if no messages are given", async function () {
      const { yaho } = await setup()
      await expect(yaho.dispatchMessages([])).to.be.revertedWithCustomError(yaho, "NoMessagesGiven")
    })
    it("creates a unique ID for each dispatched message", async function () {
      const { yaho } = await setup()
      await yaho.dispatchMessages([MESSAGE_1, MESSAGE_2])
      const hash0 = await yaho.hashes(0)
      const hash1 = await yaho.hashes(1)
      expect(hash0).not.to.equal(hash1)
    })
    it("creates a unique hashes for duplicate messaged", async function () {
      const { yaho } = await setup()
      await yaho.dispatchMessages([MESSAGE_1, MESSAGE_1])
      const hash0 = await yaho.hashes(0)
      const hash1 = await yaho.hashes(1)
      expect(hash0).not.to.equal(hash1)
    })
    it("stores hash for each dispatched message", async function () {
      const { yaho } = await setup()
      await yaho.dispatchMessages([MESSAGE_1, MESSAGE_2])
      const hash0 = await yaho.hashes(0)
      const hash1 = await yaho.hashes(1)
      expect(hash0).not.to.equal(hash1)
    })
    it("emits MessageDispatched() when a message is dispatched", async function () {
      const { yaho } = await setup()
      const tx = await yaho.dispatchMessages([MESSAGE_1, MESSAGE_2])
      await expect(tx).to.emit(yaho, "MessageDispatched")
    })
  })

  describe("relayMessagesToAdapters()", function () {
    it("reverts if no message IDs are given", async function () {
      const { yaho, messageRelay } = await setup()
      await yaho.dispatchMessages([MESSAGE_1, MESSAGE_2])
      await expect(yaho.relayMessagesToAdapters([], [messageRelay.address], [yaho.address, yaho.address]))
        .to.be.revertedWithCustomError(yaho, "NoMessageIdsGiven")
        .withArgs(yaho.address)
    })
    it("reverts if no adapters are given", async function () {
      const { yaho } = await setup()
      await yaho.dispatchMessages([MESSAGE_1, MESSAGE_2])
      await expect(yaho.relayMessagesToAdapters([ID_ZERO], [], [yaho.address, yaho.address]))
        .to.be.revertedWithCustomError(yaho, "NoAdaptersGiven")
        .withArgs(yaho.address)
    })
    it("relays dispatched message to the given adapters", async function () {
      const { yaho, messageRelay } = await setup()
      await yaho.dispatchMessages([MESSAGE_1, MESSAGE_2])
      const receipts = await yaho.callStatic.relayMessagesToAdapters(
        [ID_ZERO, ID_ONE],
        [messageRelay.address, messageRelay.address],
        [yaho.address, yaho.address],
      )
      expect(receipts[0]).to.equal(ID_ZERO)
      expect(receipts[1]).to.equal(ID_ONE)
    })
  })

  describe("dispatchMessagesToAdapters()", function () {
    it("reverts if no adapters are given", async function () {
      const { yaho } = await setup()
      await expect(yaho.dispatchMessagesToAdapters([MESSAGE_1, MESSAGE_2], [], [yaho.address, yaho.address]))
        .to.be.revertedWithCustomError(yaho, "NoAdaptersGiven")
        .withArgs(yaho.address)
    })
    it("dispatches messages and relays to the given adapters", async function () {
      const { yaho, messageRelay } = await setup()
      expect(
        await yaho.dispatchMessagesToAdapters(
          [MESSAGE_1, MESSAGE_2],
          [messageRelay.address, messageRelay.address],
          [yaho.address, yaho.address],
        ),
      )
      const [messageIds, receipts] = await yaho.callStatic.dispatchMessagesToAdapters(
        [MESSAGE_1, MESSAGE_2],
        [messageRelay.address, messageRelay.address],
        [yaho.address, yaho.address],
      )
      expect(messageIds[0]).to.equal(ID_TWO)
      expect(receipts[0]).to.equal(ID_TWO)
    })
  })
})
