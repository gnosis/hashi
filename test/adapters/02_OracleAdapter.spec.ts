import { expect } from "chai"
import { hexlify } from "ethers/lib/utils"
import { ethers, network } from "hardhat"

const CHAIN_ID = 1

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
  return ethers.utils.RLP.encode(values.map(emptyHexlify))
}

const setup = async () => {
  await network.provider.request({ method: "hardhat_reset", params: [] })
  const [wallet] = await ethers.getSigners()
  const OracleAdapter = await ethers.getContractFactory("MockOracleAdapter")
  const oracleAdapter = await OracleAdapter.deploy()
  await mine(120)
  const reportedBlockNumbers = [100, 110]
  const reportedBlockHeaders = await Promise.all(
    reportedBlockNumbers.map(async (blockNumber) => (await ethers.provider.getBlock(blockNumber)).hash),
  )
  await oracleAdapter.setBlockHeaders(CHAIN_ID, reportedBlockNumbers, reportedBlockHeaders)
  return {
    wallet,
    oracleAdapter,
    reportedBlockNumbers,
    reportedBlockHeaders,
  }
}

const getBlock = async (blockNumber: number) => {
  return await ethers.provider.send("eth_getBlockByNumber", [hexlify(blockNumber), false])
}

describe.only("HeaderStorage", function () {
  describe("Deploy", function () {
    it("Successfully deploys contract", async function () {
      const { oracleAdapter } = await setup()
      expect(await oracleAdapter.deployed())
    })
  })

  describe("proveHeaders()", function () {
    it("Verifies a unreported block header", async function () {
      const { oracleAdapter } = await setup()

      const bockNumbers = [110, 109, 108, 107]
      const blocks = await Promise.all(bockNumbers.map(async (blockNumber) => await getBlock(blockNumber)))
      const headerContents = blocks.map((block) => blockRLP(block))
      const headers = blocks.map((block) => block.hash)

      await oracleAdapter.proveHeaders(CHAIN_ID, headers, headerContents)
    })
  })
})
