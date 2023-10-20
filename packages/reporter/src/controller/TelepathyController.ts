import axios from "axios"
import { createPublicClient, http, createWalletClient, hexToNumber } from "viem"
import { gnosis } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import "dotenv/config"
import contract_address from "../utils/address.json"
import lightClientContractABI from "../ABIs/telepathyContractABI.json"
import adapterContractABI from "../ABIs/telepathyAdapterABI.json"
import winston from "winston"

class TelepathyController {
  sourceChain: string
  destinationChain: string
  isEnabled: boolean = false
  logger: winston.Logger
  constructor(sourceChain: string, destinationChain: string, isEnabled: boolean, logger: winston.Logger) {
    this.sourceChain = sourceChain
    this.destinationChain = destinationChain
    this.isEnabled = isEnabled
    this.logger = logger
  }

  async onBlocks(blockNumbers: string[]) {
    try {
      // Telepathy on support light client on Gnosis at the moment
      const walletClient = createWalletClient({
        chain: gnosis,
        transport: http(process.env.DEST_RPC_URL),
      })
      const publicClient = createPublicClient({
        chain: gnosis,
        transport: http(process.env.DEST_RPC_URL),
      })
      const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`)

      const adapterAddr = contract_address.telepathy.gnosis_adapter
      const lightClientAddr = contract_address.telepathy.gnosis_light_client

      // Getting the latest block number from provider
      const currentBlockNumber = await publicClient.getBlockNumber()

      // get contract events from latest block -500 : latest block
      const queryBlockLength = 1000n // the number of blocks to query
      const blockBuffer = 10n // put 10 blocks before the current block in case the node provider don't sync up at the head
      const startBlock = currentBlockNumber - queryBlockLength - blockBuffer
      const endBlock = currentBlockNumber - blockBuffer
      this.logger.info(`Telepathy: Getting Contract Event from block ${startBlock} to block  ${currentBlockNumber}`)
      const logs = await publicClient.getContractEvents({
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

      logs.forEach(async (event) => {
        // get slot value from first indexed
        const slotValue = event.topics[1]
        this.logger.info(`Fetching proof for slot ${slotValue}`)
        const postUrl = process.env.TELEPATHY_PROOF_API_URL + "5" + "/" + hexToNumber(slotValue!)
        const response = await axios.post(postUrl)
        this.logger.info(`Telepathy: Response from telepathy proof provider: ${response.data}`)
        const { chainId, slot, blockNumber, blockNumberProof, blockHash, blockHashProof } = response.data.result
        this.logger.info(`Telepathy: Calling storeBlockHeader for block number ${blockNumber}`)
        const { request, result } = await publicClient.simulateContract({
          account,
          address: adapterAddr as `0x${string}`,
          abi: adapterContractABI,
          functionName: "storeBlockHeader",
          args: [chainId, slot, blockNumber, blockNumberProof, blockHash, blockHashProof],
        })

        const txHash = await walletClient.writeContract(request)
        this.logger.info(`Telepathy: TxHash from Telepathy Controller: ${txHash} `)
      })
    } catch (error) {
      this.logger.error(`Telepathy: Error from Telepathy Controller: ${error}`)
    }
  }
}

export default TelepathyController
