import { adapters } from "@hyperlane-xyz/core/dist/contracts/middleware/liquidity-layer"
import { anyUint, anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { time } from "@nomicfoundation/hardhat-network-helpers"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address"
import { expect } from "chai"
import { Contract, Event, Signer, providers } from "ethers"
import { ethers } from "hardhat"

import Message from "../../utils/Message"
import { Chains, ZERO_ADDRESS } from "../../utils/constants"
import ProofcastEventAttestator from "./ProofcastEventAttestator"
import EVENT_SAMPLE_1 from "./samples/01_yaho-event-sample"
import EVENT_SAMPLE_2 from "./samples/02_yaho-event-sample"
import EVENT_SAMPLE_3 from "./samples/03_yaho-event-sample"

const getBlockHashes = async (_blockIds: providers.BlockTag[]) =>
  Promise.all(_blockIds.map((_id) => ethers.provider._getBlock(_id))).then((_blocks) =>
    Promise.all(_blocks.map((_block) => _block.hash)),
  )

describe("Proofcast adapter", () => {
  let event = EVENT_SAMPLE_1.event as unknown as Event
  let ids = EVENT_SAMPLE_1.ids
  let hashes = EVENT_SAMPLE_1.hashes

  const gracePeriod = 48 * 60 * 60
  const attestation = "0x"

  const deployContractsFixture = async () => {
    const Yaho = await ethers.getContractFactory("Yaho")
    const ProofcastAdapter = await ethers.getContractFactory("ProofcastAdapter")
    const signers = await ethers.getSigners()
    const receiver = signers[1]
    const yaho = await Yaho.deploy()
    const adapter = await ProofcastAdapter.deploy()
    const eventAttestator = new ProofcastEventAttestator()

    return { adapter, yaho, eventAttestator, receiver }
  }

  describe("storeHashes()", () => {
    let adapter: Contract,
      yaho: Contract,
      eventAttestator: ProofcastEventAttestator,
      statement: string,
      signature: string

    before(async () => {
      const result = await loadFixture(deployContractsFixture)
      yaho = result.yaho
      adapter = result.adapter
      eventAttestator = result.eventAttestator

      statement = eventAttestator.getStatement(event)
      signature = eventAttestator.sign(event)
    })

    it("should reject when the tee signer is not set", async () => {
      await expect(adapter.storeHashes(statement, signature)).to.rejectedWith("Tee signer not set!")
    })

    it("should set the tee address successfully", async () => {
      await expect(adapter.setTeeSigner(eventAttestator.publicKey, attestation))
        .to.emit(adapter, "TeeSignerPendingChange")
        .withArgs(eventAttestator.address, attestation, anyUint)
        .and.to.emit(adapter, "TeeSignerChanged")
        .withArgs(eventAttestator.address)

      expect(await adapter.teeAddress()).to.be.equal(eventAttestator.address)
    })

    it("should reject when yaho address is not set for the given chain id", async () => {
      await expect(adapter.storeHashes(statement, signature)).to.be.revertedWithCustomError(
        adapter,
        "UnsupportedChainId",
      )
    })

    it("should set the yaho address successfully", async () => {
      await expect(adapter.initYaho(Chains.Goerli, yaho.address))
        .to.emit(adapter, "YahoInitialized")
        .withArgs(Chains.Goerli, yaho.address)
    })

    it("should store the dispatched block hashes successfully", async () => {
      await expect(adapter.storeHashes(statement, signature))
        .to.emit(adapter, "HashStored")
        .withArgs(ids[0], hashes[0])
        .and.to.emit(adapter, "HashStored")
        .withArgs(ids[1], hashes[1])
    })

    it("should reject when invalid event bytes are used", async () => {
      const chainId = Buffer.alloc(32)
      chainId[31] = 0x05
      const context = Buffer.from([0x00, 0x00])
      const eventId = Buffer.alloc(32)
      const eventBytes = Buffer.from([0xa0]) // must be less that 0xC0, see RLPReader.isList method for further info
      const wrongRLPStatement = Buffer.concat(
        [context, chainId, eventId, eventBytes],
        context.length + chainId.length + eventId.length + eventBytes.length,
      )

      const wrongRLPStatementSignature = eventAttestator.signBytes(wrongRLPStatement)

      await expect(adapter.storeHashes(wrongRLPStatement, wrongRLPStatementSignature)).to.be.revertedWithCustomError(
        adapter,
        "InvalidEventRLP",
      )
    })

    it("should reject when invalid event is given", async () => {
      const chainId = Buffer.alloc(32)
      chainId[31] = 0x05
      const context = Buffer.from([0x00, 0x00])
      const eventId = Buffer.alloc(32)
      const eventBytes = Buffer.from([0xc0]) // here we have a list, check RLPReader.isList for further info
      const wrongRLPStatement = Buffer.concat(
        [context, chainId, eventId, eventBytes],
        context.length + chainId.length + eventId.length + eventBytes.length,
      )

      const wrongRLPStatementSignature = eventAttestator.signBytes(wrongRLPStatement)

      await expect(adapter.storeHashes(wrongRLPStatement, wrongRLPStatementSignature)).to.be.revertedWithCustomError(
        adapter,
        "InvalidEventContentLength",
      )
    })

    it("should reject when an event has an unexpected topic", async () => {
      const wrongTopic = "0x50fc1dffcf7cb921ea88cfe948029ae1d1429f40c95fdf03f7f6657ec6307bad"
      const eventWithWrongTopic = {
        ...event,
        blockHash: "0xfbecf39feb8d971316c1b1ea2ff9c94293be851355d47405ef97473be82d6bad", // Needed to change eventId
        topics: [wrongTopic, "0x50fc1dffcf7cb921ea88cfe948029ae1d1429f40c95fdf03f7f6657ec6307bad"],
      }

      const wrongStatement = eventAttestator.getStatement(eventWithWrongTopic)
      const wrongStatementSignature = eventAttestator.sign(eventWithWrongTopic)

      await expect(adapter.storeHashes(wrongStatement, wrongStatementSignature))
        .to.be.revertedWithCustomError(adapter, "UnexpectedEventTopic")
        .withArgs(wrongTopic)
    })

    it("should reject when an event have a different message id", async () => {
      const wrongMessageId = "0x0000000000000000000000000000000000000000000000000000000000000000"
      const eventWithWrongMessageId = {
        ...event,
        blockHash: "0xfbecf39feb8d971316c1b1ea2ff9c94293be851355d47405ef97473be82d6bad", // Needed to change eventId
        topics: ["0x218247aabc759e65b5bb92ccc074f9d62cd187259f2a0984c3c9cf91f67ff7cf", wrongMessageId],
      }

      const wrongStatement = eventAttestator.getStatement(eventWithWrongMessageId)
      const wrongStatementSignature = eventAttestator.sign(eventWithWrongMessageId)

      await expect(adapter.storeHashes(wrongStatement, wrongStatementSignature))
        .to.be.revertedWithCustomError(adapter, "InvalidMessageId")
        .withArgs(anyUint, anyUint)
    })

    it("should reject if another protocol id is used", async () => {
      const tmp = [...statement]
      tmp[5] = "2"
      const unallowedProtocolIdStatement = tmp.join("")
      const wrongStatement = Buffer.from(unallowedProtocolIdStatement.replace("0x", ""), "hex")
      const wrongStatementSignature = eventAttestator.signBytes(wrongStatement)

      await expect(adapter.storeHashes(wrongStatement, wrongStatementSignature))
        .to.be.revertedWithCustomError(adapter, "UnsupportedProtocolId")
        .withArgs("0x02")
    })

    it("should reject when signing an event with a different key", async () => {
      const evilEventAttestator = new ProofcastEventAttestator()
      statement = evilEventAttestator.getStatement(event)
      signature = evilEventAttestator.sign(event)

      await expect(adapter.storeHashes(statement, signature)).to.be.rejectedWith("Invalid signature")
    })
  })

  describe("setTeeSigner()", () => {
    const setup = async () => {
      const { adapter, yaho, eventAttestator } = await loadFixture(deployContractsFixture)

      await expect(adapter.setTeeSigner(eventAttestator.publicKey, attestation))
        .to.emit(adapter, "TeeSignerPendingChange")
        .and.to.emit(adapter, "TeeSignerChanged")

      await adapter.initYaho(Chains.Goerli, yaho.address)

      return { adapter, yaho, eventAttestator }
    }

    it("should wait the grace period when setting the new signer", async () => {
      const { adapter, yaho, eventAttestator } = await loadFixture(setup)
      const previousAddress = await adapter.teeAddress()
      const newEventAttestator = new ProofcastEventAttestator({
        version: 0x00,
        protocolId: 0x00,
        chainId: Chains.Goerli,
      })

      await expect(adapter.setTeeSigner(newEventAttestator.publicKey, attestation))
        .to.emit(adapter, "TeeSignerPendingChange")
        .withArgs(newEventAttestator.address, attestation, anyUint)
        .and.not.to.emit(adapter, "TeeSignerChanged")

      expect(await adapter.teeAddress()).to.be.equal(previousAddress)

      let statement = eventAttestator.getStatement(event)
      let signature = eventAttestator.sign(event)

      await expect(adapter.storeHashes(statement, signature))
        .to.emit(adapter, "HashStored")
        .withArgs(ids[0], hashes[0])
        .and.to.emit(adapter, "HashStored")
        .withArgs(ids[1], hashes[1])
        .and.not.to.emit(adapter, "TeeSignerChanged")

      expect(await adapter.teeAddress()).to.be.equal(previousAddress)

      await time.increase(gracePeriod)

      event = EVENT_SAMPLE_2.event as unknown as Event
      ids = EVENT_SAMPLE_2.ids
      hashes = EVENT_SAMPLE_2.hashes
      statement = newEventAttestator.getStatement(event)
      signature = newEventAttestator.sign(event)

      await expect(adapter.storeHashes(statement, signature))
        .to.emit(adapter, "TeeSignerChanged")
        .withArgs(newEventAttestator.address)
        .and.to.emit(adapter, "HashStored")
        .withArgs(ids[0], hashes[0])
        .and.to.emit(adapter, "HashStored")
        .withArgs(ids[1], hashes[1])
    })

    it("should wait another grace period when changing signer withing another grace period", async () => {
      const { adapter, yaho, eventAttestator } = await loadFixture(setup)
      const previousAddress = await adapter.teeAddress()
      const eventAttestator1 = new ProofcastEventAttestator()

      await expect(adapter.setTeeSigner(eventAttestator1.publicKey, attestation)).to.emit(
        adapter,
        "TeeSignerPendingChange",
      )
      expect(await adapter.teeAddress()).to.be.equal(previousAddress)

      // Let's make run some time after the change
      const timeElapsed = gracePeriod / 2
      await time.increase(timeElapsed)

      let statement = eventAttestator.getStatement(event)
      let signature = eventAttestator.sign(event)

      await expect(adapter.storeHashes(statement, signature))
        .to.emit(adapter, "HashStored")
        .withArgs(ids[0], hashes[0])
        .and.to.emit(adapter, "HashStored")
        .withArgs(ids[1], hashes[1])
        .and.not.to.emit(adapter, "TeeSignerChanged")

      expect(await adapter.teeAddress()).to.be.equal(previousAddress)

      // Another change of the tee signer, should set the new threshold to (gracePeriod + gracePeriod/2)
      const eventAttestator2 = new ProofcastEventAttestator()
      await expect(adapter.setTeeSigner(eventAttestator2.publicKey, attestation)).to.emit(
        adapter,
        "TeeSignerPendingChange",
      )

      expect(await adapter.teeAddress()).to.be.equal(previousAddress)

      await time.increase(gracePeriod / 2)

      // We are not using the same event sample as in the
      // prev test because otherwise the replay protection
      // would kick in (i.e. would reject with 'Hash already stored')
      event = EVENT_SAMPLE_3.event as unknown as Event
      ids = EVENT_SAMPLE_3.ids
      hashes = EVENT_SAMPLE_3.hashes
      statement = eventAttestator2.getStatement(event)
      signature = eventAttestator2.sign(event)

      await expect(adapter.storeHashes(statement, signature)).to.be.revertedWith("Invalid signature")

      await time.increase(gracePeriod / 2)

      await expect(adapter.storeHashes(statement, signature))
        .to.emit(adapter, "HashStored")
        .and.to.emit(adapter, "HashStored")
    })
  })

  describe("initYaho()", () => {
    it("should reject when setting for the same chain id", async () => {
      const { adapter, yaho } = await loadFixture(deployContractsFixture)
      await expect(adapter.initYaho(Chains.Hardhat, yaho.address)).to.rejectedWith("Not usable Yaho (same chainId)")
    })
  })
})
