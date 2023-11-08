import { expect } from "chai"
import { Contract } from "ethers"
import { RLP } from "ethers/lib/utils"
import { ethers, network } from "hardhat"

import { Chains } from "../constants"
import { blockRLP, getBlock, mine, toBytes32 } from "../utils"
import Message from "../utils/Message"

let oracleAdapter: Contract,
  yaho: Contract,
  reportedBlockNumbers: Array<number>,
  unreportedBlockNumbers: Array<number>,
  blocks: Array<any>,
  headerStorage: Contract,
  headerReporter: Contract,
  messageRelay: Contract

describe("OracleAdapter", function () {
  this.beforeEach(async function () {
    await network.provider.request({ method: "hardhat_reset", params: [] })
    const OracleAdapter = await ethers.getContractFactory("MockOracleAdapter")
    const Yaho = await ethers.getContractFactory("Yaho")
    const HeaderReporter = await ethers.getContractFactory("HeaderReporter")
    const HeaderStorage = await ethers.getContractFactory("HeaderStorage")
    const MessageRelay = await ethers.getContractFactory("MockMessageRelay")

    headerStorage = await HeaderStorage.deploy()
    headerReporter = await HeaderReporter.deploy(headerStorage.address)
    yaho = await Yaho.deploy(headerReporter.address)
    oracleAdapter = await OracleAdapter.deploy()
    messageRelay = await MessageRelay.deploy(yaho.address)

    await mine(120)

    unreportedBlockNumbers = [109, 108, 107]
    reportedBlockNumbers = [100, 110]
    blocks = await Promise.all(
      [...reportedBlockNumbers, ...unreportedBlockNumbers].map((_blockNumber) => getBlock(_blockNumber)),
    )

    let tx = await headerReporter.reportHeader(
      reportedBlockNumbers[0],
      [Chains.Hardhat],
      [messageRelay.address],
      [oracleAdapter.address],
      yaho.address,
    )
    const [message1] = await Message.fromReceipt(await tx.wait(1))
    const message1Hash = await yaho.hashes(message1.id)
    await oracleAdapter.setHashes(Chains.Hardhat, [message1.id], [message1Hash])

    tx = await headerReporter.reportHeader(
      reportedBlockNumbers[1],
      [Chains.Hardhat],
      [messageRelay.address],
      [oracleAdapter.address],
      yaho.address,
    )
    const [message2] = await Message.fromReceipt(await tx.wait(1))
    const message2Hash = await yaho.hashes(message2.id)
    await oracleAdapter.setHashes(Chains.Hardhat, [message2.id], [message2Hash])
  })

  describe("proveAncestralBlockHashes()", function () {
    it("Adds ancestral block hashesven blocks", async function () {
      const blockHeaders = blocks.map((_block) => blockRLP(_block))
      const tx = oracleAdapter.proveAncestralBlockHashes(Chains.Hardhat, blockHeaders, yaho.address)
      for (const block of blocks) {
        let tx2 = await headerReporter.reportHeader(
          block._blockNumber - 1,
          [Chains.Hardhat],
          [messageRelay.address],
          [oracleAdapter.address],
          yaho.address,
        )
        const [message] = await Message.fromReceipt(await tx2.wait(1))
        const messageHash = await yaho.hashes(message.id)
        await expect(tx).to.emit(oracleAdapter, "HashStored").withArgs(message.id, messageHash)
      }
    })

    it("Reverts if given unknown blocks", async function () {
      const unreportedBlockNumber = unreportedBlockNumbers[0]
      let tx = await headerReporter.reportHeader(
        unreportedBlockNumber,
        [Chains.Hardhat],
        [messageRelay.address],
        [oracleAdapter.address],
        yaho.address,
      )
      const [message] = await Message.fromReceipt(await tx.wait(1))
      const messageHash = await yaho.hashes(message.id)

      const unreportedBlock = blocks.find((_block) => _block._blockNumber === unreportedBlockNumber)
      const blockHeaders = [blockRLP(unreportedBlock)]
      await expect(oracleAdapter.proveAncestralBlockHashes(Chains.Hardhat, blockHeaders, yaho.address))
        .to.revertedWithCustomError(oracleAdapter, "ConflictingBlockMessageHash")
        .withArgs(unreportedBlockNumber, messageHash, toBytes32(0))
    })

    it("Reverts if block header is invalid RLP encoding", async function () {
      const invalidRLP = ["0xa0000000"]
      await expect(
        oracleAdapter.proveAncestralBlockHashes(Chains.Hardhat, invalidRLP, yaho.address),
      ).to.revertedWithCustomError(oracleAdapter, "InvalidBlockHeaderRLP")
    })

    it("Reverts if block proof doesn't match valid block header lengths", async function () {
      const blockHeaderContents = RLP.decode(blockRLP(blocks[0]))
      const blockHeaderTooShortContents = blockHeaderContents.slice(0, 14)
      const blockHeaderTooShort = RLP.encode(blockHeaderTooShortContents)

      // Block header RLP contains too few elements
      await expect(oracleAdapter.proveAncestralBlockHashes(Chains.Hardhat, [blockHeaderTooShort], yaho.address))
        .to.revertedWithCustomError(oracleAdapter, "InvalidBlockHeaderLength")
        .withArgs(blockHeaderTooShortContents.length)

      const blockHeaderTooLongContents = blockHeaderContents.concat([oracleAdapter.address, oracleAdapter.address])
      const blockHeaderTooLong = RLP.encode(blockHeaderTooLongContents)

      // Block header RLP contains too many elements
      await expect(oracleAdapter.proveAncestralBlockHashes(Chains.Hardhat, [blockHeaderTooLong], yaho.address))
        .to.revertedWithCustomError(oracleAdapter, "InvalidBlockHeaderLength")
        .withArgs(blockHeaderTooLongContents.length)
    })
  })
})
