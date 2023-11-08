import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { Contract } from "ethers"
import { ethers } from "hardhat"

import { Chains } from "./constants"
import Message from "./utils/Message"

let hashi: Contract,
  yaho: Contract,
  yaru: Contract,
  oracleAdapter: Contract,
  pingPong: Contract,
  headerVault: Contract,
  messageRelay: Contract,
  headerReporter: Contract,
  headerStorage: Contract,
  fakeTo1: SignerWithAddress,
  fakeTo2: SignerWithAddress

describe("Yaru", function () {
  this.beforeEach(async function () {
    const Hashi = await ethers.getContractFactory("Hashi")
    const Yaru = await ethers.getContractFactory("Yaru")
    const Yaho = await ethers.getContractFactory("Yaho")
    const OracleAdapter = await ethers.getContractFactory("MockOracleAdapter")
    const HeaderReporter = await ethers.getContractFactory("HeaderReporter")
    const HeaderStorage = await ethers.getContractFactory("HeaderStorage")
    const HeaderVault = await ethers.getContractFactory("HeaderVault")
    const PingPong = await ethers.getContractFactory("PingPong")
    const MessageRelay = await ethers.getContractFactory("MockMessageRelay")

    const signers = await ethers.getSigners()
    fakeTo1 = signers[1]
    fakeTo2 = signers[2]

    headerStorage = await HeaderStorage.deploy()
    headerReporter = await HeaderReporter.deploy(headerStorage.address)
    hashi = await Hashi.deploy()
    yaho = await Yaho.deploy(headerReporter.address)
    headerVault = await HeaderVault.deploy()
    yaru = await Yaru.deploy(hashi.address, headerVault.address)
    oracleAdapter = await OracleAdapter.deploy()
    pingPong = await PingPong.deploy()
    messageRelay = await MessageRelay.deploy(yaho.address)

    await headerVault.initializeYaru(yaru.address)
    await yaru.initializeForChainId(Chains.Hardhat, yaho.address)
  })

  describe("constructor()", function () {
    it("Successfully deploys contract", async function () {
      expect(await yaru.deployed())
    })

    it("Sets hashi address", async function () {
      expect(await yaru.hashi()).to.equal(hashi.address)
    })

    it("Sets header vault address", async function () {
      expect(await yaru.headerVault()).to.equal(headerVault.address)
    })
  })

  describe("executeMessages()", function () {
    it("reverts if messages and messageIds are unequal lengths", async function () {
      const tx = await yaho["dispatchMessagesToAdapters(uint256[],address[],bytes[],address[],address[])"](
        [Chains.Hardhat, Chains.Hardhat],
        [fakeTo1.address, fakeTo2.address],
        ["0x01", "0x02"],
        [messageRelay.address],
        [oracleAdapter.address],
      )
      const [message1, message2] = Message.fromReceipt(await tx.wait(1))
      await expect(yaru.executeMessages([message1, message2], [message1.id], [oracleAdapter.address]))
        .to.be.revertedWithCustomError(yaru, "UnequalArrayLengths")
        .withArgs(yaru.address)
    })

    it("reverts if reported hash does not match calculated hash", async function () {
      const tx = await yaho["dispatchMessagesToAdapters(uint256[],address[],bytes[],address[],address[])"](
        [Chains.Hardhat, Chains.Hardhat],
        [fakeTo1.address, fakeTo2.address],
        ["0x01", "0x02"],
        [messageRelay.address],
        [oracleAdapter.address],
      )
      const [message1, message2] = Message.fromReceipt(await tx.wait(1))
      await oracleAdapter.setHashes(
        Chains.Hardhat,
        [message1.id, message2.id],
        [await yaho.hashes(message1.id), await yaho.hashes(message1.id)],
      )
      message1.data = "0xff"
      await expect(yaru.executeMessages([message1], [message1.id], [oracleAdapter.address]))
        .to.be.revertedWithCustomError(yaru, "MessageFailure")
        .withArgs(message1.id, ethers.utils.keccak256(Buffer.from("HashMismatch")))
      message2.data = "0xff"
      await expect(yaru.executeMessages([message2], [message2.id], [oracleAdapter.address]))
        .to.be.revertedWithCustomError(yaru, "MessageFailure")
        .withArgs(message2.id, ethers.utils.keccak256(Buffer.from("HashMismatch")))
    })

    it("reverts if call fails", async function () {
      const tx = await yaho["dispatchMessagesToAdapters(uint256[],address[],bytes[],address[],address[])"](
        [Chains.Hardhat],
        [pingPong.address],
        ["0x00"],
        [messageRelay.address],
        [oracleAdapter.address],
      )
      const [failMessage] = Message.fromReceipt(await tx.wait(1))
      await oracleAdapter.setHashes(Chains.Hardhat, [failMessage.id], [await yaho.hashes(failMessage.id)])
      await expect(yaru.executeMessages([failMessage], [failMessage.id], [oracleAdapter.address]))
        .to.be.revertedWithCustomError(yaru, "MessageFailure")
        .withArgs(failMessage.id, ethers.utils.keccak256(Buffer.from("CallFailed")))
    })

    it("executes a message", async function () {
      const tx = await yaho["dispatchMessagesToAdapters(uint256[],address[],bytes[],address[],address[])"](
        [Chains.Hardhat],
        [pingPong.address],
        ["0x01"],
        [messageRelay.address],
        [oracleAdapter.address],
      )
      const [message1] = Message.fromReceipt(await tx.wait(1))
      await oracleAdapter.setHashes(Chains.Hardhat, [message1.id], [await yaho.hashes(message1.id)])
      await expect(yaru.executeMessages([message1], [message1.id], [oracleAdapter.address]))
        .to.emit(yaru, "MessageIdExecuted")
        .withArgs(message1.fromChainId, message1.id)
        .and.to.emit(pingPong, "Pong")
        .withArgs(1)
    })

    it("executes multiple messages", async function () {
      const tx = await yaho["dispatchMessagesToAdapters(uint256[],address[],bytes[],address[],address[])"](
        [Chains.Hardhat, Chains.Hardhat],
        [pingPong.address, pingPong.address],
        ["0x01", "0x01"],
        [messageRelay.address],
        [oracleAdapter.address],
      )
      const [message1, message2] = Message.fromReceipt(await tx.wait(1))
      await oracleAdapter.setHashes(
        Chains.Hardhat,
        [message1.id, message2.id],
        [await yaho.hashes(message1.id), await yaho.hashes(message2.id)],
      )
      await expect(yaru.executeMessages([message1, message2], [message1.id, message2.id], [oracleAdapter.address]))
        .to.emit(yaru, "MessageIdExecuted")
        .withArgs(message1.fromChainId, message1.id)
        .and.to.emit(yaru, "MessageIdExecuted")
        .withArgs(message2.fromChainId, message2.id)
        .and.to.emit(pingPong, "Pong")
        .withArgs(1)
        .and.to.emit(pingPong, "Pong")
        .withArgs(2)
    })

    it("reverts if message was already executed", async function () {
      const tx = await yaho["dispatchMessagesToAdapters(uint256[],address[],bytes[],address[],address[])"](
        [Chains.Hardhat],
        [pingPong.address],
        ["0x01"],
        [messageRelay.address],
        [oracleAdapter.address],
      )
      const [message1] = Message.fromReceipt(await tx.wait(1))
      await oracleAdapter.setHashes(Chains.Hardhat, [message1.id], [await yaho.hashes(message1.id)])
      await yaru.executeMessages([message1], [message1.id], [oracleAdapter.address])
      await expect(yaru.executeMessages([message1], [message1.id], [oracleAdapter.address]))
        .to.be.revertedWithCustomError(yaru, "MessageIdAlreadyExecuted")
        .withArgs(message1.id)
    })

    it("reverts if a valid message is being executed where toChainId is not equal to block.chainid", async function () {
      const tx = await yaho["dispatchMessagesToAdapters(uint256[],address[],bytes[],address[],address[])"](
        [Chains.Gnosis],
        [pingPong.address],
        ["0x01"],
        [messageRelay.address],
        [oracleAdapter.address],
      )
      const [message1] = Message.fromReceipt(await tx.wait(1))
      await oracleAdapter.setHashes(Chains.Hardhat, [message1.id], [await yaho.hashes(message1.id)])
      await expect(yaru.executeMessages([message1], [message1.id], [oracleAdapter.address]))
        .to.be.revertedWithCustomError(yaru, "MessageFailure")
        .withArgs(message1.id, "0x5625a2ac717b1cd54256f048b75a2092e54b5fe43e26a943409cd86b5fc487a6") // keccak256("InvalidToChainId")
    })

    it("executes a message from HeaderReporter", async function () {
      const blockNumber = await ethers.provider.getBlockNumber()
      const block = await ethers.provider.getBlock(blockNumber - 1)
      const tx = await headerReporter.reportHeader(
        blockNumber - 1,
        [Chains.Hardhat],
        [messageRelay.address],
        [oracleAdapter.address],
        yaho.address,
      )
      const [message1] = Message.fromReceipt(await tx.wait(1))
      await oracleAdapter.setHashes(Chains.Hardhat, [message1.id], [await yaho.hashes(message1.id)])

      await expect(yaru.executeMessages([message1], [message1.id], [oracleAdapter.address]))
        .to.emit(yaru, "MessageIdExecuted")
        .withArgs(message1.fromChainId, message1.id)
        .and.to.emit(headerVault, "NewBlock")
        .withArgs(message1.fromChainId, blockNumber - 1, block.hash)
      expect(await headerVault.getBlockHeader(Chains.Hardhat, blockNumber - 1)).to.be.eq(block.hash)
    })
  })
})
