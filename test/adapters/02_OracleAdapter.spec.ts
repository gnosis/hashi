import { expect } from "chai"
import { RLP, hexlify } from "ethers/lib/utils"
import { ethers, network } from "hardhat"

const CHAIN_ID = 1

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
  const reportedBlockHeaders = blocks
    .filter((block) => reportedBlockNumbers.includes(block.blockNumber))
    .map((block) => block.hash)

  await oracleAdapter.setBlockHeaders(CHAIN_ID, reportedBlockNumbers, reportedBlockHeaders)
  return {
    wallet,
    oracleAdapter,
    reportedBlockNumbers,
    reportedBlockHeaders,
    unreportedBlockNumbers,
    blocks,
  }
}

describe("HeaderStorage", function () {
  describe("Deploy", function () {
    it("Successfully deploys contract", async function () {
      const { oracleAdapter } = await setup()
      expect(await oracleAdapter.deployed())
    })
  })

  describe("proveAncestralHeaders()", function () {
    it("Adds ancestral block headers of proven blocks", async function () {
      const { oracleAdapter, blocks } = await setup()
      const headerProofs = blocks.map((block) => blockRLP(block))

      // All blocks should have been proven and their ancestral headers stored
      for (const block of blocks) {
        await expect(oracleAdapter.proveAncestralHeaders(CHAIN_ID, headerProofs))
          .to.emit(oracleAdapter, "HeaderStored")
          .withArgs(block.blockNumber - 1, block.parentHash)
      }
    })

    it("Reverts if given unknown blocks", async function () {
      const { oracleAdapter, blocks, unreportedBlockNumbers } = await setup()
      const unreportedBlockNumber = unreportedBlockNumbers[0]
      const unreportedBlock = blocks.find((block) => block.blockNumber === unreportedBlockNumber)
      const headerProofs = [blockRLP(unreportedBlock)]

      await expect(oracleAdapter.proveAncestralHeaders(CHAIN_ID, headerProofs))
        .to.revertedWithCustomError(oracleAdapter, "InvalidBlockHeaderProof")
        .withArgs(unreportedBlockNumber, unreportedBlock.hash)
    })

    it("Reverts if block proof is invalid RLP", async function () {
      const { oracleAdapter } = await setup()
      const invalidRLP = ["0xa0000000"]

      // Invalid block proof
      await expect(oracleAdapter.proveAncestralHeaders(CHAIN_ID, invalidRLP)).to.revertedWithCustomError(
        oracleAdapter,
        "InvalidBlockHeaderProofRLP",
      )
    })

    it("Reverts if block proof doesn't match valid block header lengths", async function () {
      const { oracleAdapter, blocks } = await setup()
      const blockHeaderProofContents = RLP.decode(blockRLP(blocks[0]))
      const blockHeaderProofTooShortContents = blockHeaderProofContents.slice(0, 14)
      const blockHeaderProofTooShort = RLP.encode(blockHeaderProofTooShortContents)

      // Block proof RLP contains too few elements
      await expect(oracleAdapter.proveAncestralHeaders(CHAIN_ID, [blockHeaderProofTooShort]))
        .to.revertedWithCustomError(oracleAdapter, "InvalidBlockHeaderProofLength")
        .withArgs(blockHeaderProofTooShortContents.length)

      console.log(blockHeaderProofContents.length)
      const blockHeaderProofTooLongContents = blockHeaderProofContents.concat([
        oracleAdapter.address,
        oracleAdapter.address,
      ])
      const blockHeaderProofTooLong = RLP.encode(blockHeaderProofTooLongContents)

      // Block proof RLP contains too many elements
      await expect(oracleAdapter.proveAncestralHeaders(CHAIN_ID, [blockHeaderProofTooLong]))
        .to.revertedWithCustomError(oracleAdapter, "InvalidBlockHeaderProofLength")
        .withArgs(blockHeaderProofTooLongContents.length)
    })
  })
})
