import axios from "axios"
import { Chain, hexToNumber } from "viem"
import { Mutex } from "async-mutex"

import LightClientContractABI from "../ABIs/TelepathyContractABI.json"
import AdapterContractABI from "../ABIs/TelepathyAdapterABI.json"
import BaseController from "./BaseController"

import { BaseControllerConfigs } from "./BaseController"

interface TelepathyReporterControllerConfigs extends BaseControllerConfigs {
  lightClientAddresses: { [chainName: string]: `0x${string}` }
  baseProofUrl: string
}

class TelepathyReporterController extends BaseController {
  lastProcessedBlock: bigint
  lightClientAddresses: { [chainName: string]: `0x${string}` }
  private _baseProofUrl: string

  constructor(_configs: TelepathyReporterControllerConfigs) {
    super(_configs, "TelepathyReporterController")

    this.lightClientAddresses = _configs.lightClientAddresses
    this._baseProofUrl = _configs.baseProofUrl

    this.lastProcessedBlock = 30946038n
  }

  async update() {
    try {
      let mutex = new Mutex()
      for (const chain of this.destinationChains as Chain[]) {
        const client = this.multiClient.getClientByChain(chain)

        const currentBlockNumber = await client.getBlockNumber()
        const fromBlock = this.lastProcessedBlock === 0n ? currentBlockNumber : this.lastProcessedBlock + 1n
        const toBlock = currentBlockNumber
        this.logger.info(
          `getting HeadUpdate events in [${fromBlock},${toBlock}] on ${chain.name} , on contract ${
            this.lightClientAddresses[chain.name]
          }...`,
        )

        const logs = await client.getContractEvents({
          address: this.lightClientAddresses[chain.name] as `0x${string}`,
          abi: LightClientContractABI,
          eventName: "HeadUpdate",
          fromBlock,
          toBlock,
        })

        if (logs.length == 0) {
          this.logger.info("No HeadUpdate events. Skipping ...")
          this.lastProcessedBlock = toBlock
          continue
        }

        this.logger.info(`detected ${logs.length} HeadUpdate events. Processing them ...`)
        logs.forEach(async (_log: any) => {
          const slotValue = _log.topics[1]
          this.logger.info(`fetching proof for slot ${slotValue} on ${chain.name} ...`)

          const response = await axios.post(`${this._baseProofUrl}${this.sourceChain.id}/${hexToNumber(slotValue!)}`)
          const { chainId, slot, blockNumber, blockNumberProof, blockHash, blockHashProof } = response.data.result
          this.logger.info(
            `calling storeBlockHeader for block number ${blockNumber} on contract ${
              this.adapterAddresses[chain.name]
            } ...`,
          )

          const { request } = await client.simulateContract({
            address: this.adapterAddresses[chain.name] as `0x${string}`,
            abi: AdapterContractABI,
            functionName: "storeBlockHeader",
            args: [chainId, slot, blockNumber, blockNumberProof, blockHash, blockHashProof],
          })
          const release = await mutex.acquire()
          const txHash = await client.writeContract(request)
          this.logger.info(`tx sent on ${chain.name}: ${txHash}`)
          release()
        })
        this.lastProcessedBlock = toBlock
      }
    } catch (_error) {
      this.logger.error(_error)
    }
  }
}

export default TelepathyReporterController
