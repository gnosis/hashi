import { Chain } from "viem"
import winston from "winston"
import { Mutex } from "async-mutex"

import Multiclient from "./MultiClient"
import BaseController from "./controllers/BaseController"

interface BlockListenerConfigs {
  controllers: any[]
  logger: winston.Logger
  intervalFetchBlocksMs: number
  intervalsUpdateLightClients: { [controllerName: string]: number }
  multiclient: Multiclient
  sourceChain: Chain
  queryBlockLength: number
  blockBuffer: number
}

class Coordinator {
  controllers: BaseController[]
  logger: winston.Logger
  multiclient: Multiclient
  intervals: ReturnType<typeof setInterval>[]
  sourceChain: Chain
  private _queryBlockLength: number
  private _blockBuffer: number
  private _intervalFetchBlocksMs: number
  private _intervalsUpdateLightClients: { [controllerName: string]: number }
  private _mutex: Mutex

  constructor(_configs: BlockListenerConfigs) {
    if (_configs.queryBlockLength > 256 - _configs.blockBuffer) {
      throw new Error(`Please choose a block length less than ${256 - _configs.blockBuffer}!`)
    }

    this.controllers = _configs.controllers
    this.logger = _configs.logger.child({ service: "Coordinator" })
    this.multiclient = _configs.multiclient
    this.sourceChain = _configs.sourceChain
    this._queryBlockLength = _configs.queryBlockLength
    this._blockBuffer = _configs.blockBuffer
    this._intervalFetchBlocksMs = _configs.intervalFetchBlocksMs
    this._intervalsUpdateLightClients = _configs.intervalsUpdateLightClients

    this.intervals = []
    this._mutex = new Mutex()
  }

  start() {
    this.fetchBlocks()
    this.intervals.push(
      setInterval(() => {
        this.fetchBlocks()
      }, this._intervalFetchBlocksMs),
    )

    const lgControllers = this.controllers.filter((_controller) => _controller.type === "lightClient")
    lgControllers.forEach((_controller) => this.updateLightClientReporterController(_controller))

    this.intervals.push(
      ...lgControllers.map((_controller) => {
        return setInterval(() => {
          this.updateLightClientReporterController(_controller)
        }, this._intervalsUpdateLightClients[_controller.name])
      }),
    )
  }

  stop() {
    this.intervals.forEach(clearInterval)
  }

  async fetchBlocks() {
    try {
      const client = this.multiclient.getClientByChain(this.sourceChain)

      const currentBlockNumber = await client.getBlockNumber()
      const startBlock = currentBlockNumber - BigInt(this._queryBlockLength)
      const endBlock = currentBlockNumber - BigInt(this._blockBuffer)

      const blocks = Array.from(
        { length: Number(this._queryBlockLength - this._blockBuffer + 1) },
        (_, _index) => startBlock + BigInt(_index),
      )
      this.logger.info(`New blocks detected on ${this.sourceChain.name}: [${startBlock},${endBlock}]`)
      for (const controller of this.controllers.filter((_controller) => _controller.type === "classic")) {
        const release = await this._mutex.acquire()
        await controller.onBlocks(blocks)
        release()
      }
    } catch (_err) {
      this.logger.error(`Error from block listener ${_err}`)
    }
  }

  async updateLightClientReporterController(_controller: BaseController) {
    const release = await this._mutex.acquire()
    await _controller.update()
    release()
  }
}

export default Coordinator
