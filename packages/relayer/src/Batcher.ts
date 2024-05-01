import winston from "winston"
import { Collection, Document } from "mongodb"

interface BatcherConfigs {
  logger: winston.Logger
  collection: Collection
  minBatchSize: number
  findCondition: any
  createBatchIntervalTimeMs: number
  finalStatus: string
  onBatch: (logs: Document[]) => Promise<any>
}

class Batcher {
  logger: winston.Logger
  collection: Collection
  minBatchSize: number
  finalStatus: string
  onBatch: (logs: Document[]) => Promise<any>
  private _createBatchIntervalTimeMs: number
  private _findCondition: any

  constructor(_configs: BatcherConfigs) {
    this.logger = _configs.logger.child({ service: "Batcher" })
    this.collection = _configs.collection
    this.minBatchSize = _configs.minBatchSize
    this._findCondition = _configs.findCondition
    this.finalStatus = _configs.finalStatus
    this._createBatchIntervalTimeMs = _configs.createBatchIntervalTimeMs
    this.onBatch = _configs.onBatch
  }

  async start() {
    try {
      this._createBatch()
      setInterval(() => {
        this._createBatch()
      }, this._createBatchIntervalTimeMs)
    } catch (_err) {}
  }

  private async _createBatch() {
    try {
      const values = await this.collection.find(this._findCondition).toArray()
      this.logger.info(`Current batch size: ${values.length} missing: ${this.minBatchSize - values.length}`)
      if (values.length >= this.minBatchSize) {
        this.logger.info(`Batch found. Processing it ...`)
        const result = await this.onBatch(values)
        await Promise.all(
          values.map(({ _id }) =>
            this.collection.updateOne(
              { _id },
              {
                $set: { ...result, status: this.finalStatus },
              },
            ),
          ),
        )
      }
    } catch (_err) {
      this.logger.error(`${_err}`)
    }
  }
}

export default Batcher
