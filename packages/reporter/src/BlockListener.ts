import { Chain } from "viem"
import winston from "winston"

import Multiclient from "./MultiClient"
import { BlockListenerConfig } from "./types/index"

class BlocksListener {
  controllers: any[]
  logger: winston.Logger
  timeFetchBlocksMs: number
  lastProcessedBlock: bigint = 0n
  multiclient: Multiclient
  _interval: ReturnType<typeof setInterval> | undefined // NodeJs.Timeout
  sourceChain: Chain
  queryBlockLength: number

  constructor(props: BlockListenerConfig) {
    this.controllers = props.controllers
    this.timeFetchBlocksMs = props.timeFetchBlocksMs
    this.logger = props.logger
    this.multiclient = props.multiclient
    this.sourceChain = props.sourceChain
    this.lastProcessedBlock = props.lastProcessedBlock
    this.queryBlockLength = props.queryBlockLength
  }

  start() {
    this._fetchBlocks()
    this._interval = setInterval(() => {
      this._fetchBlocks()
    }, this.timeFetchBlocksMs)
  }

  stop() {
    clearInterval(this._interval)
  }

  async _fetchBlocks() {
    try {
      const client = this.multiclient.getClientByChain(this.sourceChain)

      const currentBlockNumber = await client.getBlockNumber()
      this.logger.info(`Current Block Number: ${currentBlockNumber} , on source chain: ${process.env.SOURCE_CHAIN}`)
      if (!this.lastProcessedBlock) {
        this.lastProcessedBlock = await client.getBlockNumber()
      }

      const blockBuffer = 10 // put 10 blocks before the current block in case the node provider don't sync up at the head
      if (this.queryBlockLength > 256 - blockBuffer) {
        this.logger.error(`Please choose a block length less than ${256 - blockBuffer}!`)
      }
      const startBlock = this.lastProcessedBlock - BigInt(this.queryBlockLength)
      const endBlock = this.lastProcessedBlock - BigInt(blockBuffer)
      const blocks = await Promise.all(
        Array.from(
          { length: Number(this.queryBlockLength - blockBuffer + 1) },
          (_, index) => startBlock + BigInt(index),
        ),
      )
      this.logger.info(`Fetching block from ${startBlock} to ${endBlock}`)

      await Promise.all(this.controllers.map((_controller: any) => _controller.onBlocks(blocks)))

      this.lastProcessedBlock = endBlock
      this.logger.info(`Waiting for ${this.timeFetchBlocksMs / 1000}s...`)
    } catch (_err) {
      this.logger.error(`error from block listener ${_err}`)
    }
  }
}

export default BlocksListener
