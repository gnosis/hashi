import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { Contract } from "ethers"
import { ethers } from "hardhat"

import { Chains } from "../../constants"
import { toBytes32 } from "../../utils"
import Message from "../../utils/Message"

let headerStorage: Contract,
  headerReporter: Contract,
  yaho: Contract,
  amb: Contract,
  ambMessageRelay: Contract,
  ambAdapter: Contract,
  yaru: Contract,
  pingPong: Contract,
  hashi: Contract,
  headerVault: Contract,
  fakeYaho: SignerWithAddress

describe("AMBMessageRelayer", function () {
  this.beforeEach(async function () {
    const HeaderStorage = await ethers.getContractFactory("HeaderStorage")
    const HeaderReporter = await ethers.getContractFactory("HeaderReporter")
    const HeaderVault = await ethers.getContractFactory("HeaderVault")
    const Yaho = await ethers.getContractFactory("Yaho")
    const Yaru = await ethers.getContractFactory("Yaru")
    const AMB = await ethers.getContractFactory("MockAMB")
    const AMBMessageRelay = await ethers.getContractFactory("AMBMessageRelay")
    const AMBAdapter = await ethers.getContractFactory("AMBAdapter")
    const PingPong = await ethers.getContractFactory("PingPong")
    const Hashi = await ethers.getContractFactory("Hashi")

    const signers = await ethers.getSigners()
    fakeYaho = signers[1]

    headerStorage = await HeaderStorage.deploy()
    headerReporter = await HeaderReporter.deploy(headerStorage.address)
    yaho = await Yaho.deploy(headerReporter.address)
    amb = await AMB.deploy()
    ambMessageRelay = await AMBMessageRelay.deploy(amb.address, fakeYaho.address)
    ambAdapter = await AMBAdapter.deploy(amb.address, ambMessageRelay.address, toBytes32(Chains.Hardhat))
    pingPong = await PingPong.deploy()
    headerVault = await HeaderVault.deploy()
    hashi = await Hashi.deploy()
    yaru = await Yaru.deploy(hashi.address, headerVault.address)

    await yaru.initializeForChainId(Chains.Hardhat, yaho.address)
  })

  describe("Deploy", function () {
    it("Successfully deploys contract", async function () {
      expect(await ambMessageRelay.deployed())
    })
  })

  describe("relayMessages()", function () {
    it("Reverts if it's called by Yaho", async function () {
      const tx = await yaho["dispatchMessages(uint256[],address[],bytes[])"](
        [Chains.Gnosis, Chains.Gnosis],
        [pingPong.address, pingPong.address],
        ["0x01", "0x01"],
      )
      const [message1, message2] = Message.fromReceipt(await tx.wait(1))
      await expect(
        ambMessageRelay.relayMessages(
          [Chains.Gnosis, Chains.Gnosis],
          [message1.id, message2.id],
          [await yaho.hashes(message1.id), await yaho.hashes(message2.id)],
          ambAdapter.address,
        ),
      ).to.be.revertedWithCustomError(ambMessageRelay, "NotYaho")
    })

    it("Relays message hashes over AMB", async function () {
      const tx = await yaho["dispatchMessages(uint256[],address[],bytes[])"](
        [Chains.Gnosis, Chains.Gnosis],
        [pingPong.address, pingPong.address],
        ["0x01", "0x01"],
      )
      const [message1, message2] = Message.fromReceipt(await tx.wait(1))
      await expect(
        ambMessageRelay
          .connect(fakeYaho)
          .relayMessages(
            [Chains.Gnosis, Chains.Gnosis],
            [message1.id, message2.id],
            [await yaho.hashes(message1.id), await yaho.hashes(message2.id)],
            ambAdapter.address,
          ),
      )
        .to.emit(ambMessageRelay, "MessageRelayed")
        .withArgs(ambMessageRelay.address, message1.id)
        .and.to.emit(ambMessageRelay, "MessageRelayed")
        .withArgs(ambMessageRelay.address, message2.id)
    })

    it("Reports headers to AMB", async function () {
      let tx = await yaho["dispatchMessages(uint256[],address[],bytes[])"](
        [Chains.Gnosis, Chains.Gnosis],
        [pingPong.address, pingPong.address],
        ["0x01", "0x01"],
      )
      const [message1, message2] = Message.fromReceipt(await tx.wait(1))

      tx = await ambMessageRelay
        .connect(fakeYaho)
        .relayMessages(
          [Chains.Gnosis, Chains.Gnosis],
          [message1.id, message2.id],
          [await yaho.hashes(message1.id), await yaho.hashes(message2.id)],
          ambAdapter.address,
        )
      await expect(tx)
        .to.emit(ambMessageRelay, "MessageRelayed")
        .withArgs(ambMessageRelay.address, message1.id)
        .and.to.emit(ambMessageRelay, "MessageRelayed")
        .withArgs(ambMessageRelay.address, message2.id)
      const hash1 = await yaho.hashes(message1.id)
      const hash2 = await yaho.hashes(message2.id)

      const finalTx = await ambAdapter.populateTransaction.storeHashes([message1.id, message2.id], [hash1, hash2])
      await expect(tx).to.emit(amb, "MessagePassed").withArgs(ambMessageRelay.address, finalTx.data)
    })

    it("Reports headers to AMB and executes a message", async function () {
      let tx = await yaho["dispatchMessages(uint256[],address[],bytes[])"](
        [Chains.Hardhat, Chains.Hardhat],
        [pingPong.address, pingPong.address],
        ["0x01", "0x01"],
      )
      const [message1, message2] = Message.fromReceipt(await tx.wait(1))

      tx = await ambMessageRelay
        .connect(fakeYaho)
        .relayMessages(
          [Chains.Hardhat, Chains.Hardhat],
          [message1.id, message2.id],
          [await yaho.hashes(message1.id), await yaho.hashes(message2.id)],
          ambAdapter.address,
        )
      await expect(tx)
        .to.emit(ambMessageRelay, "MessageRelayed")
        .withArgs(ambMessageRelay.address, message1.id)
        .and.to.emit(ambMessageRelay, "MessageRelayed")
        .withArgs(ambMessageRelay.address, message2.id)
      const hash1 = await yaho.hashes(message1.id)
      const hash2 = await yaho.hashes(message2.id)

      await ambAdapter.populateTransaction.storeHashes([message1.id, message2.id], [hash1, hash2])
      await expect(
        yaru.executeMessages([message1, message2], [message1.id, message2.id], [ambAdapter.address]),
      ).to.emit(pingPong, "Pong")
    })

    it("cannot execute a valid message where the toChainId is not equal to block.chainid", async function () {
      let tx = await yaho["dispatchMessages(uint256[],address[],bytes[])"](
        [Chains.Gnosis, Chains.Gnosis],
        [pingPong.address, pingPong.address],
        ["0x01", "0x01"],
      )
      const [message1, message2] = Message.fromReceipt(await tx.wait(1))

      tx = await ambMessageRelay
        .connect(fakeYaho)
        .relayMessages(
          [Chains.Hardhat, Chains.Hardhat],
          [message1.id, message2.id],
          [await yaho.hashes(message1.id), await yaho.hashes(message2.id)],
          ambAdapter.address,
        )
      await expect(tx)
        .to.emit(ambMessageRelay, "MessageRelayed")
        .withArgs(ambMessageRelay.address, message1.id)
        .and.to.emit(ambMessageRelay, "MessageRelayed")
        .withArgs(ambMessageRelay.address, message2.id)
      const hash1 = await yaho.hashes(message1.id)
      const hash2 = await yaho.hashes(message2.id)

      await ambAdapter.populateTransaction.storeHashes([message1.id, message2.id], [hash1, hash2])
      await expect(yaru.executeMessages([message1, message2], [message1.id, message2.id], [ambAdapter.address]))
        .to.be.revertedWithCustomError(yaru, "MessageFailure")
        .withArgs(message1.id, "0x5625a2ac717b1cd54256f048b75a2092e54b5fe43e26a943409cd86b5fc487a6") // keccak256("InvalidToChainId")
    })
  })
})
