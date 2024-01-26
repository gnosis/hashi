import { expect } from "chai"
import { Contract } from "ethers"
import { ethers } from "hardhat"

import Message from "./utils/Message"
import { Chains } from "./utils/constants"

let reporter1: Contract,
  reporter2: Contract,
  reporter3: Contract,
  reporter4: Contract,
  yaho: Contract,
  yaru: Contract,
  hashi: Contract,
  adapter1: Contract,
  adapter2: Contract,
  adapter3: Contract,
  adapter4: Contract,
  pingPong1: Contract,
  pingPong2: Contract

describe("Yaru", () => {
  beforeEach(async () => {
    const Yaru = await ethers.getContractFactory("Yaru")
    const Yaho = await ethers.getContractFactory("Yaho")
    const Hashi = await ethers.getContractFactory("Hashi")
    const Reporter = await ethers.getContractFactory("MockReporter")
    const Adapter = await ethers.getContractFactory("MockOracleAdapter")
    const PingPong = await ethers.getContractFactory("PingPong")

    hashi = await Hashi.deploy()
    yaho = await Yaho.deploy()
    yaru = await Yaru.deploy(hashi.address, yaho.address, Chains.Hardhat)
    reporter1 = await Reporter.deploy(yaho.address)
    reporter2 = await Reporter.deploy(yaho.address)
    reporter3 = await Reporter.deploy(yaho.address)
    reporter4 = await Reporter.deploy(yaho.address)
    adapter1 = await Adapter.deploy()
    adapter2 = await Adapter.deploy()
    adapter3 = await Adapter.deploy()
    adapter4 = await Adapter.deploy()
    pingPong1 = await PingPong.deploy()
    pingPong2 = await PingPong.deploy()
  })

  describe("executeMessages", async () => {
    it("should not be able to execute a message if the chain id is invalid", async () => {
      const threshold = 2
      const invalidChainId = Chains.Mainnet
      const tx = await yaho.dispatchMessageToAdapters(
        invalidChainId,
        threshold,
        pingPong1.address,
        "0x01",
        [reporter1.address, reporter2.address],
        [adapter1.address, adapter2.address],
      )

      const messages = Message.fromReceipt(await tx.wait(1))
      await expect(yaru.executeMessages(messages))
        .to.be.revertedWithCustomError(yaru, "InvalidToChainId")
        .withArgs(invalidChainId, Chains.Hardhat)
    })

    it("should not be able to execute a message belonging to a different message id (aka DoS attack)", async () => {
      const threshold = 2
      const tx = await yaho.dispatchMessageToAdapters(
        Chains.Hardhat,
        threshold,
        pingPong1.address,
        "0x01",
        [reporter1.address, reporter2.address],
        [adapter1.address, adapter2.address],
      )

      // This implementation guards against a potential DoS attack where an attacker might exploit a known `messageId` of a valid message.
      // In such an attack, the attacker could attempt to execute a different message using the same `messageId`.
      //  However, since the `messageId` is derived from the message content, any change in the message content results in a different `messageId`.
      // Therefore, reusing a `messageId` for a different message is not feasible.
      // This change effectively prevents an attacker from executing unauthorized messages by leveraging previously known or valid `messageIds`,
      // enhancing the overall security of the system against message replay or substitution attacks.
      const [message] = Message.fromReceipt(await tx.wait(1))
      message.data = "0x02"
      const hash = await yaho.calculateMessageHash(message.serialize())
      await adapter1.setHashes(Chains.Hardhat, [message.id], [hash])
      await adapter2.setHashes(Chains.Hardhat, [message.id], [hash])
      await expect(yaru.executeMessages([message])).to.be.revertedWithCustomError(yaru, "ThresholdNotMet")
    })

    it("should not be able to execute a message if the threshold isn't reached", async () => {
      const threshold = 3
      const tx = await yaho.dispatchMessageToAdapters(
        Chains.Hardhat,
        threshold,
        pingPong1.address,
        "0x01",
        [reporter1.address, reporter2.address, reporter3.address],
        [adapter1.address, adapter2.address, reporter3.address],
      )
      const [message] = Message.fromReceipt(await tx.wait(1))
      const hash = await yaho.calculateMessageHash(message.serialize())
      await adapter1.setHashes(Chains.Hardhat, [message.id], [hash])
      await adapter2.setHashes(Chains.Hardhat, [message.id], [hash])
      await expect(yaru.executeMessages([message])).to.be.revertedWithCustomError(yaru, "ThresholdNotMet")
    })

    it(`should not be able to execute an already execute message`, async () => {
      const threshold = 2
      const tx = await yaho.dispatchMessageToAdapters(
        Chains.Hardhat,
        threshold,
        pingPong1.address,
        "0x01",
        [reporter1.address, reporter2.address],
        [adapter1.address, adapter2.address],
      )
      const [message] = Message.fromReceipt(await tx.wait(1))
      const hash = await yaho.calculateMessageHash(message.serialize())
      await adapter1.setHashes(Chains.Hardhat, [message.id], [hash])
      await adapter2.setHashes(Chains.Hardhat, [message.id], [hash])
      await yaru.executeMessages([message])
      await expect(yaru.executeMessages([message]))
        .to.be.revertedWithCustomError(yaru, "MessageIdAlreadyExecuted")
        .withArgs(message.id)
    })

    it(`should not be able to execute a message using different adapters`, async () => {
      const threshold = 2
      const tx = await yaho.dispatchMessageToAdapters(
        Chains.Hardhat,
        threshold,
        pingPong1.address,
        "0x01",
        [reporter1.address, reporter2.address],
        [adapter1.address, adapter2.address],
      )
      const [message] = Message.fromReceipt(await tx.wait(1))
      const hash = await yaho.calculateMessageHash(message.serialize())
      await adapter1.setHashes(Chains.Hardhat, [message.id], [hash])
      await adapter2.setHashes(Chains.Hardhat, [message.id], [hash])
      message.adapters = [adapter3.address as `0x${string}`, adapter4.address as `0x${string}`]
      await expect(yaru.executeMessages([message])).to.be.revertedWithCustomError(yaru, "ThresholdNotMet")
    })

    for (let threshold = 1; threshold <= 4; threshold++) {
      it(`should be able to execute 2 messages when the threshold is ${threshold}/4 and the messages reported are ${threshold}`, async () => {
        const tx = await yaho.dispatchMessagesToAdapters(
          Chains.Hardhat,
          [threshold, threshold],
          [pingPong1.address, pingPong2.address],
          ["0x01", "0x02"],
          [reporter1.address, reporter2.address, reporter3.address, reporter4.address],
          [adapter1.address, adapter2.address, adapter3.address, adapter4.address],
        )
        const [message1, message2] = Message.fromReceipt(await tx.wait(1))
        const hash1 = await yaho.calculateMessageHash(message1.serialize())
        const hash2 = await yaho.calculateMessageHash(message2.serialize())
        const adapters = [adapter1, adapter2, adapter3, adapter4]
        for (let i = 0; i < threshold; i++) {
          await adapters[i].setHashes(Chains.Hardhat, [message1.id], [hash1])
          await adapters[i].setHashes(Chains.Hardhat, [message2.id], [hash2])
        }
        await expect(yaru.executeMessages([message1, message2]))
          .to.emit(pingPong1, "Pong")
          .and.to.emit(pingPong2, "Pong")
      })

      it(`should be able to execute 2 messages when the threshold is ${threshold}/4 are 4`, async () => {
        const tx = await yaho.dispatchMessagesToAdapters(
          Chains.Hardhat,
          [threshold, threshold],
          [pingPong1.address, pingPong2.address],
          ["0x01", "0x02"],
          [reporter1.address, reporter2.address, reporter3.address, reporter4.address],
          [adapter1.address, adapter2.address, adapter3.address, adapter4.address],
        )
        const [message1, message2] = Message.fromReceipt(await tx.wait(1))
        const hash1 = await yaho.calculateMessageHash(message1.serialize())
        const hash2 = await yaho.calculateMessageHash(message2.serialize())
        const adapters = [adapter1, adapter2, adapter3, adapter4]
        for (let i = 0; i < threshold; i++) {
          await adapters[i].setHashes(Chains.Hardhat, [message1.id], [hash1])
          await adapters[i].setHashes(Chains.Hardhat, [message2.id], [hash2])
        }
        await expect(yaru.executeMessages([message1, message2]))
          .to.emit(pingPong1, "Pong")
          .and.to.emit(pingPong2, "Pong")
      })
    }
  })
})
