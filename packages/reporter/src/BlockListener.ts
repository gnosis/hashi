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
  blockBuffer: number

  constructor(configs: BlockListenerConfig) {
    this.controllers = configs.controllers
    this.timeFetchBlocksMs = configs.timeFetchBlocksMs
    this.logger = configs.logger
    this.multiclient = configs.multiclient
    this.sourceChain = configs.sourceChain
    this.queryBlockLength = configs.queryBlockLength
    this.blockBuffer = configs.blockBuffer
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

      let currentBlockNumber = await client.getBlockNumber()

      if (this.queryBlockLength > 256 - this.blockBuffer) {
        this.logger.error(`Please choose a block length less than ${256 - this.blockBuffer}!`)
      }

      const startBlock = currentBlockNumber - BigInt(this.queryBlockLength)
      const endBlock = currentBlockNumber - BigInt(this.blockBuffer)
      const blocks = await Promise.all(
        Array.from(
          { length: Number(this.queryBlockLength - this.blockBuffer + 1) },
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
