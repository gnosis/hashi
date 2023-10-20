import { createPublicClient, http, createWalletClient, PublicClient, Chain } from "viem"
import { mainnet, goerli, gnosis } from "viem/chains"
import winston from "winston"
class BlocksListener {
  controllers: any[]
  logger: winston.Logger
  timeFetchBlocksMs: number
  lastProcessedBlock: bigint = 0n
  _interval: ReturnType<typeof setInterval> | undefined // NodeJs.Timeout

  constructor(controllers: any[], timeFetchBlocksMs: number, logger: winston.Logger) {
    this.controllers = controllers
    this.timeFetchBlocksMs = timeFetchBlocksMs
    this.logger = logger
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
      const publicClient = createPublicClient({
        chain:
          process.env.SOURCE_CHAIN === "goerli" ? goerli : process.env.SOURCE_CHAIN === "mainnet" ? mainnet : undefined,
        transport: http(process.env.SOURCE_RPC_URL),
      })
      const currentBlockNumber = await publicClient.getBlockNumber()
      this.logger.info(`Current Block Number: ${currentBlockNumber} , on source chain: ${process.env.SOURCE_CHAIN}`)
      if (this.lastProcessedBlock !== currentBlockNumber) {
        this.lastProcessedBlock = await publicClient.getBlockNumber()

        const queryBlockLength = 100n // the number of blocks to query
        const blockBuffer = 10n // put 10 blocks before the current block in case the node provider don't sync up at the head
        const startBlock = this.lastProcessedBlock - queryBlockLength - blockBuffer
        const endBlock = this.lastProcessedBlock - blockBuffer
        const blocks = await Promise.all(
          Array.from({ length: Number(queryBlockLength + 1n) }, (value, index) => startBlock + BigInt(index)),
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
      // logger.error(_err)
      this.logger.error(`error from block listener ${_err}`)
    }
  }
}

export default BlocksListener
