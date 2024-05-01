import winston from "winston"

interface BatcherConfigs {
  service: string
  logger: winston.Logger
  minBatchSize: number
  createBatchIntervalTimeMs: number
  onBatch: (batch: any[]) => Promise<any>
  onGetValues: () => Promise<any[]>
  onResult?: (result: any, values: any) => Promise<any[]>
}

class Batcher {
  logger: winston.Logger
  minBatchSize: number
  onBatch: (batch: any[]) => Promise<any>
  onGetValues: () => Promise<any[]>
  onResult: ((result: any, values: any) => Promise<any[]>) | undefined
  private _createBatchIntervalTimeMs: number

  constructor(_configs: BatcherConfigs) {
    this.logger = _configs.logger.child({ service: _configs.service })
    this.minBatchSize = _configs.minBatchSize
    this._createBatchIntervalTimeMs = _configs.createBatchIntervalTimeMs
    this.onBatch = _configs.onBatch
    this.onGetValues = _configs.onGetValues
    this.onResult = _configs.onResult
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
      const values = await this.onGetValues()
      this.logger.info(`Current batch size: ${values.length} missing: ${this.minBatchSize - values.length}`)
      if (values.length >= this.minBatchSize) {
        this.logger.info(`Batch found. Processing it ...`)
        const result = await this.onBatch(values)
        if (result && this.onResult) {
          await this.onResult(result, values)
        }
      }
    } catch (_err) {
      this.logger.error(`${_err}`)
    }
  }
}

export default Batcher
