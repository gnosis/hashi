import axios from "axios"
import { createPublicClient, http, createWalletClient, parseAbiItem, hexToBigInt } from "viem"
import { mainnet, goerli, gnosis } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import "dotenv/config"
import reporter_config from "./type"
import contract_address from "../utils/address.json"
import lightClientContractABI from "../ABIs/telepathyContractABI.json"
import adapterContractABI from "../ABIs/telepathyAdapterABI.json"

class TelepathyReporter {
  constructor() {}
  async callReportHeader(props: reporter_config) {
    console.log("Starting Telepathy Reporter")

    var runJob = setInterval(async () => {
      try {
        await this.fetchProofAndStoreBlockHeader(props)
      } catch (error) {
        console.log("Error when calling Telepathy's storeBlockHeader : ", error)
      }
    }, Number(props.frequency_config))
  }

  async fetchProofAndStoreBlockHeader(props: reporter_config) {
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
    console.log(`Getting Contract Event from block ${currentBlockNumber - 500n} to block  ${currentBlockNumber}`)
    const logs = await publicClient.getContractEvents({
      address: contract_address.telepathy.gnosis_light_client as `0x${string}`,
      abi: lightClientContractABI,
      eventName: "HeadUpdate",
      fromBlock: currentBlockNumber - 500n,
      toBlock: currentBlockNumber,
    })

    console.log("logs ", logs)
    logs.forEach(async (event) => {
      // get slot value from first indexed
      const slotValue = event.topics[1]
      const postUrl = process.env.TELEPATHY_PROOF_API_URL + "5" + "/" + slotValue
      const response = await axios.post(postUrl)
      console.log("Response from telepathy proof provider: ", response.data)
      const { chainId, slot, blockNumber, blockNumberProof, blockHash, blockHashProof } = response.data.result
      console.log(`Calling storeBlockHeader for block number ${blockNumber}`)
      const { request, result } = await publicClient.simulateContract({
        account,
        address: adapterAddr as `0x${string}`,
        abi: adapterContractABI,
        functionName: "storeBlockHeader",
        args: [5, slot, blockNumber, blockNumberProof, blockHash, blockHashProof],
      })

      const txHash = await walletClient.writeContract(request)
      console.log("TxHash ", txHash)
    })
  }
}

export default TelepathyReporter
