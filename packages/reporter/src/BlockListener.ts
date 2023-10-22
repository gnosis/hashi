import { publicActions } from "viem"
import { mainnet, goerli, gnosis } from "viem/chains"
import Multiclient from "./MultiClient"
import winston, { query } from "winston"
class BlocksListener {
  controllers: any[]
  logger: winston.Logger
  timeFetchBlocksMs: number
  lastProcessedBlock: bigint = 0n
  multiclient: Multiclient
  _interval: ReturnType<typeof setInterval> | undefined // NodeJs.Timeout

  constructor(controllers: any[], timeFetchBlocksMs: number, logger: winston.Logger, multiclient: Multiclient) {
    this.controllers = controllers
    this.timeFetchBlocksMs = timeFetchBlocksMs
    this.logger = logger
    this.multiclient = multiclient
  }

  start() {
    this._fetchBlocks()
    this._interval = setInterval(() => {
      this._fetchBlocks()
      this.logger.info(`Waiting for ${this.timeFetchBlocksMs}ms...`)
    }, this.timeFetchBlocksMs)
  }

  stop() {
    clearInterval(this._interval)
  }

  async _fetchBlocks() {
    try {
      this.logger.info("Start to fetch blocks")

      const client = this.multiclient
        .getClientByChain(process.env.SOURCE_CHAIN === "goerli" ? goerli : mainnet)
        .extend(publicActions)
      const currentBlockNumber = await client.getBlockNumber()
      this.logger.info(`Current Block Number: ${currentBlockNumber} , on source chain: ${process.env.SOURCE_CHAIN}`)
      if (this.lastProcessedBlock !== currentBlockNumber) {
        this.lastProcessedBlock = await client.getBlockNumber()

        const queryBlockLength = 100n // the number of blocks to query, make sure it is less than 256
        const blockBuffer = 10n // put 10 blocks before the current block in case the node provider don't sync up at the head
        if (queryBlockLength > 256n - blockBuffer) {
          this.logger.error("Please choose a block length less than 256-buffer!")
        }
        const startBlock = this.lastProcessedBlock - queryBlockLength
        const endBlock = this.lastProcessedBlock - blockBuffer
        const blocks = await Promise.all(
          Array.from(
            { length: Number(queryBlockLength - blockBuffer + 1n) },
            (value, index) => startBlock + BigInt(index),
          ),
        )
        this.logger.info(`Fetching block from ${startBlock} to ${endBlock}`)

        await Promise.all(this.controllers.map((_controller: any) => _controller.onBlocks(blocks)))

        this.lastProcessedBlock = endBlock
      } else {
        this.logger.error(`${currentBlockNumber} has already been fetched!`)
      }
      // delay for 1000ms
      await new Promise((func) => setTimeout(func, 1000))
    } catch (_err) {
      this.logger.error(`error from block listener ${_err}`)
    }
  }
}

export default BlocksListener
