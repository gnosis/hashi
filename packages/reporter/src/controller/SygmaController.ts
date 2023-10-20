var cron = require("node-cron")
import { createPublicClient, http, createWalletClient, parseEther } from "viem"
import { mainnet, goerli, gnosis } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import "dotenv/config"
import contract_address from "../utils/address.json"
import contractABI from "../ABIs/SygmaReporterContractABI.json"
import winston from "winston"

class SygmaController {
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
      this.logger.info("Sygma: Starting Sygma Reporter")
      const walletClient = createWalletClient({
        chain: this.sourceChain === "goerli" ? goerli : this.sourceChain === "mainnet" ? mainnet : undefined,
        transport: http(process.env.SOURCE_RPC_URL),
      })
      const publicClient = createPublicClient({
        chain: this.sourceChain === "goerli" ? goerli : this.sourceChain === "mainnet" ? mainnet : undefined,
        transport: http(process.env.SOURCE_RPC_URL),
      })
      const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`)

      const reporterAddr = this.getSourceReporterAddr()
      const adapterAddr = this.getDestAdapter()
      const destDomainId = this.getDomainID()

      const { result, request } = await publicClient.simulateContract({
        account, // calling from account
        address: reporterAddr as `0x${string}`,
        abi: contractABI,
        functionName: "reportHeadersToDomain",
        args: [blockNumbers, adapterAddr, destDomainId, "0x"],
        value: parseEther("0.0001"),
      })
      const txhash = await walletClient.writeContract(request)
      this.logger.info(`Sygma: TxHash from Sygma Controller:  ${txhash}`)
    } catch (error) {
      this.logger.error(`Sygma: Error from Sygma Controller: ${error}`)
    }
  }
  getSourceReporterAddr() {
    switch (this.sourceChain) {
      case "goerli":
        return contract_address.sygma.goerli_reporter
      case "ethereum":
        return contract_address.sygma.ethereum_reporter
      default:
        return contract_address.sygma.goerli_reporter
    }
  }
  getDestAdapter() {
    switch (this.destinationChain) {
      case "gnosis":
        return contract_address.sygma.gnosis_adapter
      default:
        return contract_address.sygma.gnosis_adapter
    }
  }
  getDomainID() {
    switch (this.destinationChain) {
      case "gnosis":
        return 101
      default:
        return 101
    }
  }
}

export default SygmaController
