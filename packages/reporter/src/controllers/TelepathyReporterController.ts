import axios from "axios"
import { hexToNumber, Chain } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import winston from "winston"
import "dotenv/config"

import lightClientContractABI from "../ABIs/TelepathyContractABI.json"
import adapterContractABI from "../ABIs/TelepathyAdapterABI.json"
import Multiclient from "../MultiClient"
import { ControllerConfig } from "../types/index"
import { settings } from "../settings"

class TelepathyReporterController {
  sourceChain: Chain
  destinationChains: Chain[]
  name: string = "telepathy"
  logger: winston.Logger
  multiClient: Multiclient
  reporterAddr: string
  adapterAddr: { [chainName: string]: string }
  constructor(props: ControllerConfig) {
    this.sourceChain = props.sourceChain
    this.destinationChains = props.destinationChains
    this.logger = props.logger
    this.multiClient = props.multiClient
    this.reporterAddr = props.reporterAddress
    this.adapterAddr = props.adapterAddress
  }
  async onBlocks(blockNumbers: string[]) {
    try {
      // Telepathy on support light client on Gnosis at the moment

      for (const chain of this.destinationChains) {
        const client = this.multiClient.getClientByChain(chain)
        const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`)

        const adapterAddr = this.adapterAddr[chain.name.toLocaleLowerCase()]
        const lightClientAddr = settings.contractAddresses.gnosis.TelepathyLightClient

        // Getting the latest block number from provider
        const currentBlockNumber = await client.getBlockNumber()

        // get contract events from latest block - 1000 : latest block - 10
        const queryBlockLength = 1000n // the number of blocks to query
        const blockBuffer = 10n // put 10 blocks before the current block in case the node provider don't sync up at the head
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
          const postUrl = process.env.TELEPATHY_PROOF_API_URL + "5" + "/" + hexToNumber(slotValue!)
          const response = await axios.post(postUrl)
          this.logger.info(`Telepathy: Response from telepathy proof provider: ${response.data}`)
          const { chainId, slot, blockNumber, blockNumberProof, blockHash, blockHashProof } = response.data.result
          this.logger.info(`Telepathy: Calling storeBlockHeader for block number ${blockNumber}`)
          const { request, result } = await client.simulateContract({
            account,
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
