import axios from "axios"
import { hexToNumber, Chain } from "viem"
import winston from "winston"

import lightClientContractABI from "../ABIs/TelepathyContractABI.json"
import adapterContractABI from "../ABIs/TelepathyAdapterABI.json"
import Multiclient from "../MultiClient"
import { ControllerConfig } from "../types/index"

class TelepathyReporterController {
  sourceChain: Chain
  destinationChains: Chain[]
  name: string = "telepathy"
  logger: winston.Logger
  multiClient: Multiclient
  isLightClient: boolean
  adapterAddresses: { [chainName: string]: `0x${string}` }
  lightClientAddresses: { [chainName: string]: `0x${string}` }
  baseProofUrl: string
  blockBuffer: string
  lastProcessedBlock: bigint = 30000000n

  constructor(configs: ControllerConfig) {
    this.sourceChain = configs.sourceChain
    this.destinationChains = configs.destinationChains
    this.logger = configs.logger
    this.multiClient = configs.multiClient
    this.isLightClient = configs.isLightClient
    this.adapterAddresses = configs.adapterAddresses
    this.lightClientAddresses = configs.data.lightClientAddresses
    this.baseProofUrl = configs.data.baseProofUrl

    this.blockBuffer = configs.data.blockBuffer
  }
  async onBlocks() {
    try {
      // Telepathy only support light client on Gnosis at the moment
      this.logger.info("Telepathy: Starting Telepathy Reporter")

      for (const chain of this.destinationChains) {
        const client = this.multiClient.getClientByChain(chain)

        const adapterAddr = this.adapterAddresses[chain.name.toLocaleLowerCase()]
        const lightClientAddr = this.lightClientAddresses[chain.name.toLocaleLowerCase()]

        // Getting the latest block number from provider
        const currentBlockNumber = await client.getBlockNumber()

        // get contract events from latest block - queryBlockLength : latest block - blockBuffer

        const blockBuffer = BigInt(this.blockBuffer) // put ${buffer} blocks before the current block in case the node provider don't sync up at the head
        const startBlock = this.lastProcessedBlock
        const endBlock = currentBlockNumber - blockBuffer

        this.logger.info(
          `Telepathy: Getting Contract Event from block ${startBlock} to block ${endBlock} on ${chain.name}`,
        )

        const logs = await client.getContractEvents({
          address: lightClientAddr as `0x${string}`,
          abi: lightClientContractABI,
          eventName: "HeadUpdate",
          fromBlock: startBlock,
          toBlock: endBlock,
        })

        if (logs.length == 0) {
          this.logger.error("No event is found!")
          return
        }

        logs.forEach(async (event: any) => {
          const slotValue = event.topics[1]
          this.logger.info(`Fetching proof for slot ${slotValue} on ${chain.name}`)

          const url = `${this.baseProofUrl}${this.sourceChain.id}/${hexToNumber(slotValue!)}`

          const response = await axios.post(url)
          const { chainId, slot, blockNumber, blockNumberProof, blockHash, blockHashProof } = response.data.result
          this.logger.info(`Telepathy: Calling storeBlockHeader for block number ${blockNumber}`)

          const { request } = await client.simulateContract({
            address: adapterAddr as `0x${string}`,
            abi: adapterContractABI,
            functionName: "storeBlockHeader",
            args: [chainId, slot, blockNumber, blockNumberProof, blockHash, blockHashProof],
          })

          const txHash = await client.writeContract(request)
          setTimeout(() => {}, 2000)

          this.logger.info(`Telepathy: TxHash from Telepathy Controller: ${txHash} on ${chain.name} `)
        })
        this.lastProcessedBlock = endBlock
      }
    } catch (error) {
      this.logger.error(`Telepathy: Error from Telepathy Controller: ${error}`)
    }
  }
}

export default TelepathyReporterController
