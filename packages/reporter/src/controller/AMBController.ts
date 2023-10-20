var cron = require("node-cron")
import { createPublicClient, http, createWalletClient, PublicClient, Chain } from "viem"
import { mainnet, goerli, gnosis } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import "dotenv/config"
import contract_address from "../utils/address.json"
import contractABI from "../ABIs/ambReporterContractABI.json"
import winston from "winston"

class AMBController {
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
      this.logger.info("AMB: Starting AMB Reporter")
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

      const { result, request } = await publicClient.simulateContract({
        account, // calling from account
        address: reporterAddr as `0x${string}`,
        abi: contractABI,
        functionName: "reportHeaders",
        args: [blockNumbers, adapterAddr, process.env.GAS],
      })

      const txhash = await walletClient.writeContract(request)
      this.logger.info(`AMB: TxHash from AMB Controller:  ${txhash}`)
    } catch (error) {
      this.logger.error(`AMB: Error from AMB Controller: ${error}`)
    }
  }
  getSourceReporterAddr() {
    switch (this.sourceChain) {
      case "goerli":
        return contract_address.amb.goerli_reporter
      case "ethereum":
        return contract_address.amb.ethereum_reporter
      default:
        return contract_address.amb.goerli_reporter
    }
  }
  getDestAdapter() {
    switch (this.destinationChain) {
      case "gnosis":
        return contract_address.amb.gnosis_adapter
      default:
        return contract_address.amb.gnosis_adapter
    }
  }
}

export default AMBController
