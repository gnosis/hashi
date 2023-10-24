import axios from "axios"
import { hexToNumber, Chain } from "viem"
import winston from "winston"
import "dotenv/config"

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
  reporterAddress: string
  adapterAddresses: { [chainName: string]: `0x${string}` }
  data: any

  constructor(configs: ControllerConfig) {
    this.sourceChain = configs.sourceChain
    this.destinationChains = configs.destinationChains
    this.logger = configs.logger
    this.multiClient = configs.multiClient
    this.reporterAddress = configs.reporterAddress
    this.adapterAddresses = configs.adapterAddresses
    this.data = configs.data
  }
  async onBlocks(blockNumbers: string[]) {
    try {
      // Telepathy only support light client on Gnosis at the moment

      for (const chain of this.destinationChains) {
        const client = this.multiClient.getClientByChain(chain)

        const adapterAddr = this.adapterAddresses[chain.name.toLocaleLowerCase()]
        const lightClientAddr = this.data.lightClientAddress

        // Getting the latest block number from provider
        const currentBlockNumber = await client.getBlockNumber()

        // get contract events from latest block - queryBlockLength : latest block - blockBuffer
        const queryBlockLength = BigInt(this.data.queryBlockLength) // the number of blocks to query
        const blockBuffer = BigInt(this.data.blockBuffer) // put ${buffer} blocks before the current block in case the node provider don't sync up at the head
        const startBlock = currentBlockNumber - queryBlockLength
        const endBlock = currentBlockNumber - blockBuffer

        this.logger.info(`Telepathy: Getting Contract Event from block ${startBlock} to block  ${currentBlockNumber}`)

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
          // get slot value from first indexed
          const slotValue = event.topics[1]
          this.logger.info(`Fetching proof for slot ${slotValue}`)
          const postUrl = this.data.proofURL + "5" + "/" + hexToNumber(slotValue!)

          const response = await axios.post(postUrl)
          const { chainId, slot, blockNumber, blockNumberProof, blockHash, blockHashProof } = response.data.result
          this.logger.info(`Telepathy: Calling storeBlockHeader for block number ${blockNumber}`)

          const { request } = await client.simulateContract({
            address: adapterAddr as `0x${string}`,
            abi: adapterContractABI,
            functionName: "storeBlockHeader",
            args: [chainId, slot, blockNumber, blockNumberProof, blockHash, blockHashProof],
          })

          const txHash = await client.writeContract(request)
          this.logger.info(`Telepathy: TxHash from Telepathy Controller: ${txHash} `)
        })
      }
    } catch (error) {
      this.logger.error(`Telepathy: Error from Telepathy Controller: ${error}`)
    }
  }
}

export default TelepathyReporterController
