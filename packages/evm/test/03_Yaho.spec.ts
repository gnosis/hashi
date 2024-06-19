import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address"
import { expect } from "chai"
import { Contract } from "ethers"
import { ethers } from "hardhat"

import { toBytes32 } from "./utils"
import Message from "./utils/Message"
import { Chains, ZERO_ADDRESS } from "./utils/constants"

let reporter1: Contract,
  reporter2: Contract,
  headerStorage: Contract,
  yaho: Contract,
  receiver1: SignerWithAddress,
  receiver2: SignerWithAddress,
  adapter1: SignerWithAddress,
  adapter2: SignerWithAddress

describe("Yaho", () => {
  beforeEach(async () => {
    const Yaho = await ethers.getContractFactory("Yaho")
    const Reporter = await ethers.getContractFactory("MockReporter")
    const HeaderStorage = await ethers.getContractFactory("HeaderStorage")

    const signers = await ethers.getSigners()
    receiver1 = await signers[1]
    receiver2 = await signers[2]
    adapter1 = await signers[3]
    adapter2 = await signers[4]

    headerStorage = await HeaderStorage.deploy()
    yaho = await Yaho.deploy()
    reporter1 = await Reporter.deploy(headerStorage.address, yaho.address)
    reporter2 = await Reporter.deploy(headerStorage.address, yaho.address)
  })

  describe("dispatchMessage", () => {
    it("should dispatch a single message without calling the reporter contracts", async () => {
      const threshold = 2
      const tx = await yaho.dispatchMessage(
        Chains.Gnosis,
        threshold,
        receiver1.address,
        "0x01",
        [reporter1.address, reporter2.address],
        [adapter1.address, adapter2.address],
      )
      const [message] = Message.fromReceipt(await tx.wait(1))
      await expect(tx).to.emit(yaho, "MessageDispatched").withArgs(message.id, anyValue) // FIXME: https://github.com/NomicFoundation/hardhat/issues/3833
      expect(await yaho.getPendingMessageHash(message.id)).to.be.eq(
        await yaho.calculateMessageHash(message.serialize()),
      )
    })

    it("should fail to dispatch a single message because reporters array size does not match the adapter one", async () => {
      const threshold = 2
      await expect(
        yaho.dispatchMessage(
          Chains.Gnosis,
          threshold,
          receiver1.address,
          "0x01",
          [reporter1.address],
          [adapter1.address, adapter2.address],
        ),
      )
        .to.be.revertedWithCustomError(yaho, "UnequalArrayLengths")
        .withArgs(1, 2)
    })

    it("should fail to dispatch a single message because no reporters are given", async () => {
      const threshold = 2
      await expect(
        yaho.dispatchMessage(
          Chains.Gnosis,
          threshold,
          receiver1.address,
          "0x01",
          [],
          [adapter1.address, adapter2.address],
        ),
      ).to.be.revertedWithCustomError(yaho, "NoReportersGiven")
    })

    it("should fail to dispatch a single message because no adapters are given", async () => {
      const threshold = 2
      await expect(
        yaho.dispatchMessage(
          Chains.Gnosis,
          threshold,
          receiver1.address,
          "0x01",
          [reporter1.address, reporter2.address],
          [],
        ),
      ).to.be.revertedWithCustomError(yaho, "NoAdaptersGiven")
    })

    it("should fail to dispatch a single message because the threshold cannot be 0", async () => {
      const threshold = 0
      await expect(
        yaho.dispatchMessage(
          Chains.Gnosis,
          threshold,
          receiver1.address,
          "0x01",
          [reporter1.address, reporter2.address],
          [adapter1.address, adapter2.address],
        ),
      )
        .to.be.revertedWithCustomError(yaho, "InvalidThreshold")
        .withArgs(0, 2)
    })

    it("should fail to dispatch a single message because the threshold cannot be greather than reporters or adapters array's sizes", async () => {
      const threshold = 3
      await expect(
        yaho.dispatchMessage(
          Chains.Gnosis,
          threshold,
          receiver1.address,
          "0x01",
          [reporter1.address, reporter2.address],
          [adapter1.address, adapter2.address],
        ),
      )
        .to.be.revertedWithCustomError(yaho, "InvalidThreshold")
        .withArgs(3, 2)
    })

    it("should dispatch a single message without calling the reporter because an adapter that doesn't need a reporter is used", async () => {
      const threshold = 2
      const tx = await yaho.dispatchMessage(
        Chains.Gnosis,
        threshold,
        receiver1.address,
        "0x01",
        [ZERO_ADDRESS, reporter2.address],
        [adapter1.address, adapter2.address],
      )
      const [message] = Message.fromReceipt(await tx.wait(1))
      await expect(tx).to.emit(yaho, "MessageDispatched").withArgs(message.id, anyValue) // FIXME: https://github.com/NomicFoundation/hardhat/issues/3833
      expect(await yaho.getPendingMessageHash(message.id)).to.be.eq(
        await yaho.calculateMessageHash(message.serialize()),
      )
    })
  })

  describe("dispatchMessageToAdapters", () => {
    it("should dispatch a single message and call the reporter contracts", async () => {
      const threshold = 2
      const targetChainId = Chains.Gnosis
      const tx = await yaho.dispatchMessageToAdapters(
        targetChainId,
        threshold,
        receiver1.address,
        "0x01",
        [reporter1.address, reporter2.address],
        [adapter1.address, adapter2.address],
      )
      const [message] = Message.fromReceipt(await tx.wait(1))
      const expectedMessageHash = await yaho.calculateMessageHash(message.serialize())
      await expect(tx)
        .to.emit(yaho, "MessageDispatched")
        .withArgs(message.id, anyValue) // FIXME: https://github.com/NomicFoundation/hardhat/issues/3833
        .and.to.emit(reporter1, "MessageDispatched")
        .withArgs(targetChainId, adapter1.address, message.id, expectedMessageHash)
        .and.to.emit(reporter2, "MessageDispatched")
        .withArgs(targetChainId, adapter2.address, message.id, expectedMessageHash)
      expect(await yaho.getPendingMessageHash(message.id)).to.be.eq(toBytes32(0))
    })

    it("should fail to dispatch a single message because no reporters are given", async () => {
      const threshold = 2
      await expect(
        yaho.dispatchMessageToAdapters(
          Chains.Gnosis,
          threshold,
          receiver1.address,
          "0x01",
          [],
          [adapter1.address, adapter2.address],
        ),
      ).to.be.revertedWithCustomError(yaho, "NoReportersGiven")
    })

    it("should fail to dispatch a single message because no adapters are given", async () => {
      const threshold = 2
      await expect(
        yaho.dispatchMessageToAdapters(
          Chains.Gnosis,
          threshold,
          receiver1.address,
          "0x01",
          [reporter1.address, reporter2.address],
          [],
        ),
      ).to.be.revertedWithCustomError(yaho, "NoAdaptersGiven")
    })

    it("should fail to dispatch a single message because the threshold cannot be 0", async () => {
      const threshold = 0
      await expect(
        yaho.dispatchMessageToAdapters(
          Chains.Gnosis,
          threshold,
          receiver1.address,
          "0x01",
          [reporter1.address, reporter2.address],
          [adapter1.address, adapter2.address],
        ),
      )
        .to.be.revertedWithCustomError(yaho, "InvalidThreshold")
        .withArgs(0, 2)
    })

    it("should fail to dispatch a single message because the threshold cannot be greather than reporters or adapters array's sizes", async () => {
      const threshold = 3
      await expect(
        yaho.dispatchMessageToAdapters(
          Chains.Gnosis,
          threshold,
          receiver1.address,
          "0x01",
          [reporter1.address, reporter2.address],
          [adapter1.address, adapter2.address],
        ),
      )
        .to.be.revertedWithCustomError(yaho, "InvalidThreshold")
        .withArgs(3, 2)
    })
  })

  describe("dispatchMessagesToAdapters", () => {
    it("should dispatch 2 messages and call the reporter contracts", async () => {
      const threshold = 2
      const targetChainId = Chains.Gnosis
      const tx = await yaho.dispatchMessagesToAdapters(
        targetChainId,
        [threshold, threshold],
        [receiver1.address, receiver2.address],
        ["0x01", "0x02"],
        [reporter1.address, reporter2.address],
        [adapter1.address, adapter2.address],
      )
      const [message1, message2] = Message.fromReceipt(await tx.wait(1))
      const expectedMessageHash1 = await yaho.calculateMessageHash(message1.serialize())
      const expectedMessageHash2 = await yaho.calculateMessageHash(message2.serialize())
      await expect(tx)
        .to.emit(yaho, "MessageDispatched")
        .withArgs(message1.id, anyValue) // FIXME: https://github.com/NomicFoundation/hardhat/issues/3833
        .and.to.emit(reporter1, "MessageDispatched")
        .withArgs(targetChainId, adapter1.address, message1.id, expectedMessageHash1)
        .and.to.emit(reporter1, "MessageDispatched")
        .withArgs(targetChainId, adapter1.address, message2.id, expectedMessageHash2)
        .and.to.emit(reporter2, "MessageDispatched")
        .withArgs(targetChainId, adapter2.address, message1.id, expectedMessageHash1)
        .and.to.emit(reporter2, "MessageDispatched")
        .withArgs(targetChainId, adapter2.address, message2.id, expectedMessageHash2)
      expect(await yaho.getPendingMessageHash(message1.id)).to.be.eq(toBytes32(0))
      expect(await yaho.getPendingMessageHash(message2.id)).to.be.eq(toBytes32(0))
    })

    it("should fail dispatch 2 messages because thresholds array size does not match te receivers one", async () => {
      const threshold = 2
      const targetChainId = Chains.Gnosis
      await expect(
        yaho.dispatchMessagesToAdapters(
          targetChainId,
          [threshold],
          [receiver1.address, receiver2.address],
          ["0x01", "0x02"],
          [reporter1.address, reporter2.address],
          [adapter1.address, adapter2.address],
        ),
      )
        .to.be.revertedWithCustomError(yaho, "UnequalArrayLengths")
        .withArgs(1, 2)
    })

    it("should fail dispatch 2 messages because thresholds array size does not match te data one", async () => {
      const threshold = 2
      const targetChainId = Chains.Gnosis
      await expect(
        yaho.dispatchMessagesToAdapters(
          targetChainId,
          [threshold, threshold],
          [receiver1.address, receiver2.address],
          ["0x01"],
          [reporter1.address, reporter2.address],
          [adapter1.address, adapter2.address],
        ),
      )
        .to.be.revertedWithCustomError(yaho, "UnequalArrayLengths")
        .withArgs(2, 1)
    })

    it("should fail to dispatch 2 messages because no reporters are given", async () => {
      const threshold = 2
      await expect(
        yaho.dispatchMessagesToAdapters(
          Chains.Gnosis,
          [threshold, threshold],
          [receiver1.address, receiver2.address],
          ["0x01", "0x02"],
          [],
          [adapter1.address, adapter2.address],
        ),
      ).to.be.revertedWithCustomError(yaho, "NoReportersGiven")
    })

    it("should fail to dispatch 2 messages because no adapters are given", async () => {
      const threshold = 2
      await expect(
        yaho.dispatchMessagesToAdapters(
          Chains.Gnosis,
          [threshold, threshold],
          [receiver1.address, receiver2.address],
          ["0x01", "0x02"],
          [reporter1.address, reporter2.address],
          [],
        ),
      ).to.be.revertedWithCustomError(yaho, "NoAdaptersGiven")
    })

    it("should fail to dispatch a single message because the threshold cannot be 0", async () => {
      const threshold = 0
      await expect(
        yaho.dispatchMessagesToAdapters(
          Chains.Gnosis,
          [threshold, threshold],
          [receiver1.address, receiver2.address],
          ["0x01", "0x02"],
          [reporter1.address, reporter2.address],
          [adapter1.address, adapter2.address],
        ),
      )
        .to.be.revertedWithCustomError(yaho, "InvalidThreshold")
        .withArgs(0, 2)
    })

    it("should fail to dispatch a single message because the threshold cannot be greather than reporters or adapters array's sizes", async () => {
      const threshold = 3
      await expect(
        yaho.dispatchMessagesToAdapters(
          Chains.Gnosis,
          [threshold, threshold],
          [receiver1.address, receiver2.address],
          ["0x01", "0x02"],
          [reporter1.address, reporter2.address],
          [adapter1.address, adapter2.address],
        ),
      )
        .to.be.revertedWithCustomError(yaho, "InvalidThreshold")
        .withArgs(3, 2)
    })
  })

  describe("relayMessagesToAdapters", () => {
    it("should not relay messages that don't have the same targetChainId", async () => {
      const [tx1, tx2] = await Promise.all([
        yaho.dispatchMessage(
          Chains.Mainnet,
          2,
          receiver1.address,
          "0x01",
          [reporter1.address, reporter2.address],
          [adapter1.address, adapter2.address],
        ),
        yaho.dispatchMessage(
          Chains.Gnosis,
          2,
          receiver1.address,
          "0x01",
          [reporter1.address, reporter2.address],
          [adapter1.address, adapter2.address],
        ),
      ])
      const [message1] = Message.fromReceipt(await tx1.wait(1))
      const [message2] = Message.fromReceipt(await tx2.wait(1))
      await expect(yaho.relayMessagesToAdapters([message1, message2]))
        .to.be.revertedWithCustomError(yaho, "InvalidMessage")
        .withArgs(message2.serialize())
    })

    it("should not relay messages that don't have the same adapters", async () => {
      const [tx1, tx2] = await Promise.all([
        yaho.dispatchMessage(Chains.Mainnet, 1, receiver1.address, "0x01", [reporter1.address], [adapter1.address]),
        yaho.dispatchMessage(
          Chains.Gnosis,
          2,
          receiver1.address,
          "0x01",
          [reporter1.address, reporter2.address],
          [adapter1.address, adapter2.address],
        ),
      ])
      const [message1] = Message.fromReceipt(await tx1.wait(1))
      const [message2] = Message.fromReceipt(await tx2.wait(1))
      await expect(yaho.relayMessagesToAdapters([message1, message2]))
        .to.be.revertedWithCustomError(yaho, "InvalidMessage")
        .withArgs(message2.serialize())
    })

    it("should not relay messages that don't have the same adapters", async () => {
      const targetChainId = Chains.Gnosis
      const threshold = 2
      const [tx1, tx2] = await Promise.all([
        yaho.dispatchMessage(
          targetChainId,
          threshold,
          receiver1.address,
          "0x01",
          [reporter1.address, reporter2.address],
          [adapter1.address, adapter2.address],
        ),
        yaho.dispatchMessage(
          targetChainId,
          threshold,
          receiver2.address,
          "0x02",
          [reporter1.address, reporter2.address],
          [adapter1.address, adapter2.address],
        ),
      ])
      const [message1] = Message.fromReceipt(await tx1.wait(1))
      const [message2] = Message.fromReceipt(await tx2.wait(1))
      expect(await yaho.getPendingMessageHash(message1.id)).to.be.eq(
        await yaho.calculateMessageHash(message1.serialize()),
      )
      expect(await yaho.getPendingMessageHash(message2.id)).to.be.eq(
        await yaho.calculateMessageHash(message2.serialize()),
      )
      await expect(yaho.relayMessagesToAdapters([message1, message2]))
        .to.emit(reporter1, "MessageDispatched")
        .withArgs(targetChainId, adapter1.address, message1.id, await yaho.calculateMessageHash(message1.serialize()))
        .and.to.emit(reporter1, "MessageDispatched")
        .withArgs(targetChainId, adapter1.address, message2.id, await yaho.calculateMessageHash(message2.serialize()))
        .and.to.emit(reporter2, "MessageDispatched")
        .withArgs(targetChainId, adapter2.address, message1.id, await yaho.calculateMessageHash(message1.serialize()))
        .and.to.emit(reporter2, "MessageDispatched")
        .withArgs(targetChainId, adapter2.address, message2.id, await yaho.calculateMessageHash(message2.serialize()))
      expect(await yaho.getPendingMessageHash(message1.id)).to.be.eq(toBytes32(0))
      expect(await yaho.getPendingMessageHash(message2.id)).to.be.eq(toBytes32(0))
    })

    it("should not be able to relay the same message twice", async () => {
      const targetChainId = Chains.Gnosis
      const threshold = 2
      const tx = await yaho.dispatchMessage(
        targetChainId,
        threshold,
        receiver1.address,
        "0x01",
        [reporter1.address, reporter2.address],
        [adapter1.address, adapter2.address],
      )

      const [message] = Message.fromReceipt(await tx.wait(1))
      await expect(yaho.relayMessagesToAdapters([message, message]))
        .to.be.revertedWithCustomError(yaho, "MessageHashNotFound")
        .withArgs(message.id)
    })
  })
})
