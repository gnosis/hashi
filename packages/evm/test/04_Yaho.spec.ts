import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address"
import { expect } from "chai"
import { Contract } from "ethers"
import { ethers } from "hardhat"

import { Chains, ZERO_ADDRESS } from "./constants"
import { toBytes32 } from "./utils"
import Message from "./utils/Message"

let messageRelay: Contract,
  owner: SignerWithAddress,
  yaho: Contract,
  fakeTo1: SignerWithAddress,
  fakeTo2: SignerWithAddress,
  fakeAdapter1: SignerWithAddress,
  fakeHeaderReporter: SignerWithAddress

describe("Yaho", function () {
  this.beforeEach(async function () {
    const Yaho = await ethers.getContractFactory("Yaho")
    const MessageRelay = await ethers.getContractFactory("MockMessageRelay")

    const signers = await ethers.getSigners()
    owner = signers[0]
    fakeTo1 = await signers[1]
    fakeTo2 = await signers[2]
    fakeAdapter1 = await signers[3]
    fakeHeaderReporter = await signers[4]

    yaho = await Yaho.deploy(fakeHeaderReporter.address)
    messageRelay = await MessageRelay.deploy()
  })

  describe("Deploy", function () {
    it("Successfully deploys contract", async function () {
      expect(await yaho.deployed())
    })
  })

  describe("dispatchMessages() - different message data", function () {
    it("creates a unique ID for each dispatched message", async function () {
      const tx = await yaho["dispatchMessages(uint256[],address[],bytes[])"](
        [Chains.Gnosis, Chains.Mainnet],
        [fakeTo1.address, fakeTo2.address],
        ["0x01", "0x02"],
      )
      const [message1, message2] = Message.fromReceipt(await tx.wait(1))
      await expect(tx)
        .to.emit(yaho, "MessageDispatched")
        .withArgs(anyValue, owner.address, Chains.Gnosis, fakeTo1.address, "0x01")
        .and.to.emit(yaho, "MessageDispatched")
        .withArgs(anyValue, owner.address, Chains.Mainnet, fakeTo2.address, "0x02")
      const hash1 = await yaho.hashes(message1.id)
      const hash2 = await yaho.hashes(message2.id)
      expect(hash1).not.to.equal(hash2)
    })

    it("creates a unique messageIds for duplicate messages", async function () {
      const tx = await yaho["dispatchMessages(uint256[],address[],bytes[])"](
        [Chains.Mainnet, Chains.Mainnet],
        [fakeTo1.address, fakeTo1.address],
        ["0x01", "0x01"],
      )
      const [message1, message2] = Message.fromReceipt(await tx.wait(1))
      await expect(tx)
        .to.emit(yaho, "MessageDispatched")
        .withArgs(anyValue, owner.address, Chains.Mainnet, fakeTo1.address, "0x01")
        .and.to.emit(yaho, "MessageDispatched")
        .withArgs(anyValue, owner.address, Chains.Mainnet, fakeTo1.address, "0x01")
      expect(message1.id).not.to.equal(message2.id)
    })
  })

  describe("dispatchMessages() - same message data", function () {
    it("creates a unique ID for each dispatched message", async function () {
      const tx = await yaho["dispatchMessages(uint256[],address[],bytes)"](
        [Chains.Gnosis, Chains.Mainnet],
        [fakeTo1.address, fakeTo2.address],
        "0x01",
      )
      const [message1, message2] = Message.fromReceipt(await tx.wait(1))
      await expect(tx)
        .to.emit(yaho, "MessageDispatched")
        .withArgs(anyValue, owner.address, Chains.Gnosis, fakeTo1.address, "0x01")
        .and.to.emit(yaho, "MessageDispatched")
        .withArgs(anyValue, owner.address, Chains.Mainnet, fakeTo2.address, "0x01")
      const hash1 = await yaho.hashes(message1.id)
      const hash2 = await yaho.hashes(message2.id)
      expect(hash1).not.to.equal(hash2)
    })

    it("creates a unique messageIds for duplicate messages", async function () {
      const tx = await yaho["dispatchMessages(uint256[],address[],bytes)"](
        [Chains.Gnosis, Chains.Mainnet],
        [fakeTo1.address, fakeTo2.address],
        "0x01",
      )
      const [message1, message2] = Message.fromReceipt(await tx.wait(1))
      await expect(tx)
        .to.emit(yaho, "MessageDispatched")
        .withArgs(anyValue, owner.address, Chains.Gnosis, fakeTo1.address, "0x01")
        .and.to.emit(yaho, "MessageDispatched")
        .withArgs(anyValue, owner.address, Chains.Mainnet, fakeTo2.address, "0x01")
      expect(message1.id).not.to.equal(message2.id)
    })
  })

  describe("relayMessagesToAdapters()", function () {
    it("reverts if no messages IDs are given", async function () {
      await yaho["dispatchMessages(uint256[],address[],bytes)"](
        [Chains.Gnosis, Chains.Mainnet],
        [fakeTo1.address, fakeTo2.address],
        "0x01",
      )

      await expect(yaho.relayMessagesToAdapters([], [], [messageRelay.address], [fakeAdapter1.address]))
        .to.be.revertedWithCustomError(yaho, "NoMessageIdsGiven")
        .withArgs(yaho.address)
    })

    it("reverts if no messages are given", async function () {
      const tx = await yaho["dispatchMessages(uint256[],address[],bytes)"](
        [Chains.Gnosis, Chains.Mainnet],
        [fakeTo1.address, fakeTo2.address],
        "0x01",
      )
      const [message1, message2] = Message.fromReceipt(await tx.wait(1))
      await expect(
        yaho.relayMessagesToAdapters([], [message1.id, message2.id], [messageRelay.address], [fakeAdapter1.address]),
      )
        .to.be.revertedWithCustomError(yaho, "UnequalArrayLengths")
        .withArgs(yaho.address)
    })

    it("reverts if no message relays are given", async function () {
      const tx = await yaho["dispatchMessages(uint256[],address[],bytes)"](
        [Chains.Gnosis, Chains.Mainnet],
        [fakeTo1.address, fakeTo2.address],
        "0x01",
      )
      const [message1, message2] = Message.fromReceipt(await tx.wait(1))

      await expect(
        yaho.relayMessagesToAdapters([message1, message2], [message1.id, message2.id], [], [fakeAdapter1.address]),
      )
        .to.be.revertedWithCustomError(yaho, "NoMessageRelaysGiven")
        .withArgs(yaho.address)
    })

    it("reverts if no adapters are given", async function () {
      const tx = await yaho["dispatchMessages(uint256[],address[],bytes)"](
        [Chains.Gnosis, Chains.Mainnet],
        [fakeTo1.address, fakeTo2.address],
        "0x01",
      )
      const [message1, message2] = Message.fromReceipt(await tx.wait(1))
      await expect(
        yaho.relayMessagesToAdapters([message1, message2], [message1.id, message2.id], [messageRelay.address], []),
      )
        .to.be.revertedWithCustomError(yaho, "NoAdaptersGiven")
        .withArgs(yaho.address)
    })

    it("relays dispatched message to the given adapters", async function () {
      const tx = await yaho["dispatchMessages(uint256[],address[],bytes)"](
        [Chains.Gnosis, Chains.Mainnet],
        [fakeTo1.address, fakeTo2.address],
        "0x01",
      )
      const [message1, message2] = Message.fromReceipt(await tx.wait(1))
      await expect(
        yaho.relayMessagesToAdapters(
          [message1, message2],
          [message1.id, message2.id],
          [messageRelay.address],
          [fakeAdapter1.address],
        ),
      )
        .to.emit(messageRelay, "MessageRelayed")
        .withArgs(message1.id)
        .and.to.emit(messageRelay, "MessageRelayed")
        .withArgs(message2.id)

      expect(await messageRelay.count()).to.be.eq(2)
    })
  })

  describe("dispatchMessagesToAdapters() - single data", function () {
    it("reverts if no message message relays are given", async function () {
      await expect(
        yaho["dispatchMessagesToAdapters(uint256[],address[],bytes,address[],address[])"](
          [Chains.Gnosis, Chains.Mainnet],
          [fakeTo1.address, fakeTo2.address],
          "0x01",
          [],
          [fakeAdapter1.address],
        ),
      )
        .to.be.revertedWithCustomError(yaho, "NoMessageRelaysGiven")
        .withArgs(yaho.address)
    })

    it("reverts if no message adapters are given", async function () {
      await expect(
        yaho["dispatchMessagesToAdapters(uint256[],address[],bytes,address[],address[])"](
          [Chains.Gnosis, Chains.Mainnet],
          [fakeTo1.address, fakeTo2.address],
          "0x01",
          [messageRelay.address],
          [],
        ),
      )
        .to.be.revertedWithCustomError(yaho, "NoAdaptersGiven")
        .withArgs(yaho.address)
    })

    it("dispatches messages and relays to the given adapters", async function () {
      const tx = await yaho["dispatchMessagesToAdapters(uint256[],address[],bytes,address[],address[])"](
        [Chains.Gnosis, Chains.Mainnet],
        [fakeTo1.address, fakeTo2.address],
        "0x01",
        [messageRelay.address],
        [fakeAdapter1.address],
      )
      const [message1, message2] = Message.fromReceipt(await tx.wait(1))
      await expect(tx)
        .to.emit(messageRelay, "MessageRelayed")
        .withArgs(message1.id)
        .and.to.emit(messageRelay, "MessageRelayed")
        .withArgs(message2.id)
    })
  })

  describe("dispatchMessagesToAdapters() - multiple data", function () {
    it("reverts if no message message relays are given", async function () {
      await expect(
        yaho["dispatchMessagesToAdapters(uint256[],address[],bytes[],address[],address[])"](
          [Chains.Gnosis, Chains.Mainnet],
          [fakeTo1.address, fakeTo2.address],
          ["0x01", "0x02"],
          [],
          [fakeAdapter1.address],
        ),
      )
        .to.be.revertedWithCustomError(yaho, "NoMessageRelaysGiven")
        .withArgs(yaho.address)
    })

    it("reverts if no message adapters are given", async function () {
      await expect(
        yaho["dispatchMessagesToAdapters(uint256[],address[],bytes[],address[],address[])"](
          [Chains.Gnosis, Chains.Mainnet],
          [fakeTo1.address, fakeTo2.address],
          ["0x01", "0x02"],
          [messageRelay.address],
          [],
        ),
      )
        .to.be.revertedWithCustomError(yaho, "NoAdaptersGiven")
        .withArgs(yaho.address)
    })

    it("dispatches messages and relays to the given adapters", async function () {
      const tx = await yaho["dispatchMessagesToAdapters(uint256[],address[],bytes[],address[],address[])"](
        [Chains.Gnosis, Chains.Mainnet],
        [fakeTo1.address, fakeTo2.address],
        ["0x01", "0x02"],
        [messageRelay.address],
        [fakeAdapter1.address],
      )
      const [message1, message2] = Message.fromReceipt(await tx.wait(1))
      await expect(tx)
        .to.emit(messageRelay, "MessageRelayed")
        .withArgs(message1.id)
        .and.to.emit(messageRelay, "MessageRelayed")
        .withArgs(message2.id)
    })
  })

  describe("dispatchMessage() - EIP-5164", function () {
    it("dispatch a message", async function () {
      const tx = await yaho.dispatchMessage(Chains.Mainnet, fakeTo1.address, "0x01")
      const [message1] = Message.fromReceipt(await tx.wait(1))
      await expect(tx)
        .to.emit(yaho, "MessageDispatched")
        .withArgs(anyValue, owner.address, Chains.Mainnet, fakeTo1.address, "0x01")

      expect(await yaho.hashes(message1.id)).to.not.be.eq(toBytes32(0))
    })

    it("dispatch a message using header reporter", async function () {
      const tx = await yaho.connect(fakeHeaderReporter).dispatchMessage(Chains.Mainnet, fakeTo1.address, "0x01")
      const [message1] = Message.fromReceipt(await tx.wait(1))
      await expect(tx)
        .to.emit(yaho, "MessageDispatched")
        .withArgs(anyValue, ZERO_ADDRESS, Chains.Mainnet, fakeTo1.address, "0x01")
      expect(await yaho.hashes(message1.id)).to.not.be.eq(toBytes32(0))
    })
  })
})
