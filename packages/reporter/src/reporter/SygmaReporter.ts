var cron = require("node-cron")
import { createPublicClient, http, createWalletClient, parseEther } from "viem"
import { mainnet, goerli, gnosis } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import "dotenv/config"
import reporter_config from "./type"
import contract_address from "../utils/address.json"
import contractABI from "../ABIs/SygmaReporterContractABI.json"

class SygmaReporter {
  constructor() {}
  async callReportHeader(props: reporter_config) {
    console.log("Starting Sygma Reporter")
    const walletClient = createWalletClient({
      chain: process.env.AMB_SOURCE_CHAIN === "goerli" ? goerli : mainnet,
      transport: http(process.env.SOURCE_RPC_URL),
    })
    const publicClient = createPublicClient({
      chain: goerli,
      transport: http(process.env.SOURCE_RPC_URL),
    })
    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`)

    function getSourceReporterAddr() {
      switch (props.source_chain) {
        case "goerli":
          return contract_address.sygma.goerli_reporter
        case "ethereum":
          return contract_address.sygma.ethereum_reporter
        default:
          return contract_address.sygma.goerli_reporter
      }
    }

    function getDestAdapter() {
      switch (props.destination_chain) {
        case "gnosis":
          return contract_address.sygma.gnosis_adapter
        default:
          return contract_address.sygma.gnosis_adapter
      }
    }

    function getDomainID() {
      switch (props.destination_chain) {
        case "gnosis":
          return 101
        default:
          return 101
      }
    }
    const reporterAddr = getSourceReporterAddr()
    const adapterAddr = getDestAdapter()
    const destDomainId = getDomainID()

    cron.schedule(`${props.frequency_config}`, async () => {
      const blockNumber = await publicClient.getBlockNumber()
      // Putting a buffer here for block number in case the provider's node is not up to date.
      console.log(`Reporting BlockNumber ${blockNumber - 10n}`)
      const { result, request } = await publicClient.simulateContract({
        account, // calling from account
        address: reporterAddr as `0x${string}`,
        abi: contractABI,
        functionName: "reportHeadersToDomain",
        args: [[blockNumber - 10n], adapterAddr, destDomainId, "0x"],
        value: parseEther("0.0001"),
      })
      const txhash = await walletClient.writeContract(request)
      console.log("TxHash ", txhash)
    })
  }
}

export default SygmaReporter
