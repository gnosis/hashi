import { Chain } from "viem"
import winston from "winston"

import Multiclient from "./MultiClient"

import { BlockListenerConfigs } from "./types/index"

class BlocksListener {
  controllers: any[]
  logger: winston.Logger
  intervalFetchBlocksMs: number
  multiclient: Multiclient
  intervals: ReturnType<typeof setInterval> | undefined
  sourceChain: Chain
  queryBlockLength: number
  blockBuffer: number

  constructor(_configs: BlockListenerConfigs) {
    if (_configs.queryBlockLength > 256 - _configs.blockBuffer) {
      throw new Error(`Please choose a block length less than ${256 - _configs.blockBuffer}!`)
    }

    this.controllers = _configs.controllers
    this.intervalFetchBlocksMs = _configs.intervalFetchBlocksMs
    this.logger = _configs.logger.child({ service: "BlocksListener" })
    this.multiclient = _configs.multiclient
    this.sourceChain = _configs.sourceChain
    this.queryBlockLength = _configs.queryBlockLength
    this.blockBuffer = _configs.blockBuffer
    this.intervalFetchBlocksMs = _configs.intervalFetchBlocksMs
  }

  start() {
    this.fetchBlocks()
    this.intervals = setInterval(() => {
      this.fetchBlocks()
    }, this.intervalFetchBlocksMs)
  }

  stop() {
    clearInterval(this.intervals)
  }

  async fetchBlocks() {
    try {
      const client = this.multiclient.getClientByChain(this.sourceChain)

      const currentBlockNumber = await client.getBlockNumber()
      const startBlock = currentBlockNumber - BigInt(this.queryBlockLength)
      const endBlock = currentBlockNumber - BigInt(this.blockBuffer)

      const blocks = Array.from(
        { length: Number(this.queryBlockLength - this.blockBuffer + 1) },
        (_, _index) => startBlock + BigInt(_index),
      )
      this.logger.info(`New blocks detected on ${this.sourceChain.name}: [${startBlock},${endBlock}]`)
      this.controllers.map((_controller: any) => _controller.onBlocks(blocks))
    } catch (_err) {
      this.logger.error(`Error from block listener ${_err}`)
    }
  }
}

export default BlocksListener
