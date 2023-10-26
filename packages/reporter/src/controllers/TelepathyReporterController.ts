import axios from "axios"
import { hexToNumber } from "viem"

import LightClientContractABI from "../ABIs/TelepathyContractABI.json"
import AdapterContractABI from "../ABIs/TelepathyAdapterABI.json"
import BaseController from "./BaseController"

import { TelepathyReporterControllerConfigs } from "../types/index"

class TelepathyReporterController extends BaseController {
  lastProcessedBlock: bigint
  blockBuffer: number
  lightClientAddresses: { [chainName: string]: `0x${string}` }

  private _baseProofUrl: string
  private _intervalFetchBlocksMs: number
  private _intervals: ReturnType<typeof setInterval> | undefined

  constructor(_configs: TelepathyReporterControllerConfigs) {
    super(_configs, "TelepathyReporterController")

    this.lightClientAddresses = _configs.lightClientAddresses
    this.blockBuffer = _configs.blockBuffer
    this._intervalFetchBlocksMs = _configs.intervalFetchBlocksMs
    this._baseProofUrl = _configs.baseProofUrl

    this.lastProcessedBlock = 0n
  }

  start() {
    this.fetchHeadUpdates()
    this._intervals = setInterval(() => {
      this.fetchHeadUpdates()
    }, this._intervalFetchBlocksMs)
  }

  stop() {
    clearInterval(this._intervals)
  }

  async fetchHeadUpdates() {
    try {
      for (const chain of this.destinationChains) {
        const client = this.multiClient.getClientByChain(chain)

        const currentBlockNumber = await client.getBlockNumber()
        const fromBlock = this.lastProcessedBlock + 1n
        const toBlock = currentBlockNumber - BigInt(this.blockBuffer)

        this.logger.info(`getting HeadUpdate events in [${fromBlock},${toBlock}] on ${chain.name} ...`)

        const logs = await client.getContractEvents({
          address: this.lightClientAddresses[chain.name.toLocaleLowerCase()] as `0x${string}`,
          abi: LightClientContractABI,
          eventName: "HeadUpdate",
          fromBlock,
          toBlock,
        })

        if (logs.length == 0) {
          continue
        }

        this.logger.error(`detected ${logs.length} HeadUpdate events. Processing them ...`)
        logs.forEach(async (_log: any) => {
          const slotValue = _log.topics[1]
          this.logger.info(`fetching proof for slot ${slotValue} on ${chain.name} ...`)

          const response = await axios.post(`${this._baseProofUrl}${this.sourceChain.id}/${hexToNumber(slotValue!)}`)
          const { chainId, slot, blockNumber, blockNumberProof, blockHash, blockHashProof } = response.data.result
          this.logger.info(`calling storeBlockHeader for block number ${blockNumber} ...`)

          const { request } = await client.simulateContract({
            address: this.adapterAddresses[chain.name.toLocaleLowerCase()] as `0x${string}`,
            abi: AdapterContractABI,
            functionName: "storeBlockHeader",
            args: [chainId, slot, blockNumber, blockNumberProof, blockHash, blockHashProof],
          })

          const txHash = await client.writeContract(request)
          this.logger.info(`tx sent on ${chain.name}: ${txHash}`)
        })
        this.lastProcessedBlock = toBlock
      }
    } catch (_error) {
      this.logger.error(_error)
    }
  }
}

export default TelepathyReporterController
