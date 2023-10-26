import { Chain } from "viem"
import winston from "winston"

import Multiclient from "./MultiClient"
import { BlockListenerConfig } from "./types/index"

class BlocksListener {
  controllers: any[]
  logger: winston.Logger
  timeFetchBlocksMs: number
  LCTimeStoreHashesMs: number
  multiclient: Multiclient
  intervals: ReturnType<typeof setInterval> | undefined // NodeJs.Timeout
  LCIntervals: ReturnType<typeof setInterval> | undefined // NodeJs.Timeout
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
    this.timeFetchBlocksMs = configs.timeFetchBlocksMs
    this.LCTimeStoreHashesMs = configs.LCTimeStoreHashesMs

    if (this.queryBlockLength > 256 - this.blockBuffer) {
      throw new Error(`Please choose a block length less than ${256 - this.blockBuffer}!`)
    }
  }

  start() {
    // Non Light Client based controllers, fetch block from source chain and call report BlockHeaders
    this._fetchBlocks()

    this.intervals = setInterval(() => {
      this._fetchBlocks()
      this.logger.info(`Non LC reporter controllers: Waiting for ${this.timeFetchBlocksMs / 1000} seconds`)
    }, this.timeFetchBlocksMs)

    // Light Client based controllers, query event from destination chain and call store block hash
    this._storeHashes()

    this.LCIntervals = setInterval(() => {
      this._storeHashes()
      this.logger.info(`LC reporter controllers: Waiting for ${this.LCTimeStoreHashesMs / 1000} seconds`)
    }, this.LCTimeStoreHashesMs)
  }

  stop() {
    clearInterval(this.intervals)
    clearInterval(this.LCIntervals)
  }

  async _fetchBlocks() {
    try {
      const client = this.multiclient.getClientByChain(this.sourceChain)

      let currentBlockNumber = await client.getBlockNumber()

      const startBlock = currentBlockNumber - BigInt(this.queryBlockLength)
      const endBlock = currentBlockNumber - BigInt(this.blockBuffer)
      const blocks = await Promise.all(
        Array.from(
          { length: Number(this.queryBlockLength - this.blockBuffer + 1) },
          (_, index) => startBlock + BigInt(index),
        ),
      )
      this.logger.info(`Fetching block from ${startBlock} to ${endBlock} on ${this.sourceChain.name}`)

      this.controllers.map((_controller: any) => {
        if (!_controller.isLightClient) {
          _controller.onBlocks(blocks)
        }
      })
    } catch (_err) {
      this.logger.error(`Error from block listener ${_err}`)
    }
  }
  async _storeHashes() {
    this.controllers.map((_controller: any) => {
      if (_controller.isLightClient) {
        _controller.onBlocks()
      }
    })
  }
}

export default BlocksListener
