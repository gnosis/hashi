import { expect } from "chai"
import { RLP, hexlify } from "ethers/lib/utils"
import { ethers, network } from "hardhat"

const CHAIN_ID = 1
const EMPTY_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000"

// Use evm_mine instead of hardhat_mine because hardhat_mine doesn't provide valid blocks
const mine = async (n: number) => await Promise.all([...Array(n)].map(() => network.provider.send("evm_mine")))

const emptyHexlify = (value: string) => {
  const hex = ethers.utils.hexlify(value, { hexPad: "left" })
  return hex === "0x00" ? "0x" : hex
}

const blockRLP = (block: any) => {
  const values = [
    block.parentHash,
    block.sha3Uncles,
    block.miner,
    block.stateRoot,
    block.transactionsRoot,
    block.receiptsRoot,
    block.logsBloom,
    block.difficulty,
    block.number,
    block.gasLimit,
    block.gasUsed,
    block.timestamp,
    block.extraData,
    block.mixHash,
    block.nonce,
    block.baseFeePerGas,
  ]
  return RLP.encode(values.map(emptyHexlify))
}

const getBlock = async (blockNumber: number) => {
  const block = await ethers.provider.send("eth_getBlockByNumber", [hexlify(blockNumber), false])
  return {
    ...block,
    blockNumber,
  }
}

const setup = async () => {
  await network.provider.request({ method: "hardhat_reset", params: [] })
  const [wallet] = await ethers.getSigners()
  const OracleAdapter = await ethers.getContractFactory("MockOracleAdapter")
  const oracleAdapter = await OracleAdapter.deploy()
  await mine(120)
  const reportedBlockNumbers = [100, 110]
  const unreportedBlockNumbers = [109, 108, 107]
  const blocks = await Promise.all(
    reportedBlockNumbers.concat(unreportedBlockNumbers).map(async (blockNumber) => await getBlock(blockNumber)),
  )
  const reportedBlockHashes = blocks
    .filter((block) => reportedBlockNumbers.includes(block.blockNumber))
    .map((block) => block.hash)

  await oracleAdapter.setHashes(CHAIN_ID, reportedBlockNumbers, reportedBlockHashes)
  return {
    wallet,
    oracleAdapter,
    reportedBlockNumbers,
    reportedBlockHashes,
    unreportedBlockNumbers,
    blocks,
  }
}

describe("OracleAdapter", function () {
  describe("Deploy", function () {
    it("Successfully deploys contract", async function () {
      const { oracleAdapter } = await setup()
      expect(await oracleAdapter.deployed())
    })
  })

  describe("proveAncestralBlockHashes()", function () {
    it("Adds ancestral block hashes of proven blocks", async function () {
      const { oracleAdapter, blocks } = await setup()
      const blockHeaders = blocks.map((block) => blockRLP(block))

      // All blocks should have been proven and their ancestral headers stored
      const tx = oracleAdapter.proveAncestralBlockHashes(CHAIN_ID, blockHeaders)
      for (const block of blocks) {
        await expect(tx)
          .to.emit(oracleAdapter, "HashStored")
          .withArgs(block.blockNumber - 1, block.parentHash)
      }
    })

    it("Reverts if given unknown blocks", async function () {
      const { oracleAdapter, blocks, unreportedBlockNumbers } = await setup()
      const unreportedBlockNumber = unreportedBlockNumbers[0]
      const unreportedBlock = blocks.find((block) => block.blockNumber === unreportedBlockNumber)
      const blockHeaders = [blockRLP(unreportedBlock)]

      await expect(oracleAdapter.proveAncestralBlockHashes(CHAIN_ID, blockHeaders))
        .to.revertedWithCustomError(oracleAdapter, "ConflictingBlockHeader")
        .withArgs(unreportedBlockNumber, unreportedBlock.hash, EMPTY_HASH)
    })

    it("Reverts if block header is invalid RLP encoding", async function () {
      const { oracleAdapter } = await setup()
      const invalidRLP = ["0xa0000000"]

      // Invalid block header RLP
      await expect(oracleAdapter.proveAncestralBlockHashes(CHAIN_ID, invalidRLP)).to.revertedWithCustomError(
        oracleAdapter,
        "InvalidBlockHeaderRLP",
      )
    })

    it("Reverts if block proof doesn't match valid block header lengths", async function () {
      const { oracleAdapter, blocks } = await setup()
      const blockHeaderContents = RLP.decode(blockRLP(blocks[0]))
      const blockHeaderTooShortContents = blockHeaderContents.slice(0, 14)
      const blockHeaderTooShort = RLP.encode(blockHeaderTooShortContents)

      // Block header RLP contains too few elements
      await expect(oracleAdapter.proveAncestralBlockHashes(CHAIN_ID, [blockHeaderTooShort]))
        .to.revertedWithCustomError(oracleAdapter, "InvalidBlockHeaderLength")
        .withArgs(blockHeaderTooShortContents.length)

      const blockHeaderTooLongContents = blockHeaderContents.concat([oracleAdapter.address, oracleAdapter.address])
      const blockHeaderTooLong = RLP.encode(blockHeaderTooLongContents)

      // Block header RLP contains too many elements
      await expect(oracleAdapter.proveAncestralBlockHashes(CHAIN_ID, [blockHeaderTooLong]))
        .to.revertedWithCustomError(oracleAdapter, "InvalidBlockHeaderLength")
        .withArgs(blockHeaderTooLongContents.length)
    })
  })
})
