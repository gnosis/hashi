import winston from "winston"
import { Log } from "viem"

interface WatcherConfigs {
  logger: winston.Logger
  client: any
  contractAddress: `0x${string}`
  abi: any
  eventName: string
  watchIntervalTimeMs: number
  onLogs: (logs: Log[]) => Promise<void>
}

class Watcher {
  logger: winston.Logger
  onLogs: (logs: Log[]) => Promise<void>
  client: any
  contractAddress: `0x${string}`
  abi: any
  eventName: string
  private _lastBlock: bigint
  private _watchIntervalTimeMs: number

  constructor(_configs: WatcherConfigs) {
    this.logger = _configs.logger.child({ service: "Watcher" })
    this.client = _configs.client
    this.contractAddress = _configs.contractAddress
    this.abi = _configs.abi
    this.eventName = _configs.eventName
    this.onLogs = _configs.onLogs
    this._watchIntervalTimeMs = _configs.watchIntervalTimeMs

    this._lastBlock = 0n
  }

  async start() {
    try {
      this._watch()
      setInterval(() => {
        this._watch()
      }, this._watchIntervalTimeMs)
    } catch (_err) {}
  }

  private async _watch() {
    try {
      const currentBlock = await this.client.getBlockNumber()
      if (!this._lastBlock) {
        this._lastBlock = currentBlock - 1n
      }

      const fromBlock = this._lastBlock + 1n
      const toBlock = currentBlock
      this.logger.info(`looking for ${this.eventName} events from block ${fromBlock} to block ${toBlock} ...`)

      const filter = await this.client.createContractEventFilter({
        address: this.contractAddress,
        abi: this.abi,
        eventName: this.eventName,
        fromBlock,
        toBlock,
      })

      const logs = (await this.client.getFilterLogs({ filter })) as Log[]

      if (logs.length) {
        this.logger.info(`Detected ${logs.length} new logs. Processing them ...`)
        await this.onLogs(logs)
      }

      this._lastBlock = currentBlock
    } catch (_err) {
      this.logger.error(`${_err}`)
    }
  }
}

export default Watcher
