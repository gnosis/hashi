import { publicActions, walletActions } from "viem"
import { mainnet, goerli, gnosis } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import "dotenv/config"
import contract_address from "../utils/address.json"
import contractABI from "../ABIs/ambReporterContractABI.json"
import winston from "winston"
import Multiclient from "../MultiClient"

class AMBController {
  sourceChain: string
  destinationChain: string
  isEnabled: boolean = false
  logger: winston.Logger
  multiClient: Multiclient
  constructor(
    sourceChain: string,
    destinationChain: string,
    isEnabled: boolean,
    logger: winston.Logger,
    multiClient: Multiclient,
  ) {
    this.sourceChain = sourceChain
    this.destinationChain = destinationChain
    this.isEnabled = isEnabled
    this.logger = logger
    this.multiClient = multiClient
  }

  async onBlocks(blockNumbers: bigint[]) {
    try {
      this.logger.info("AMB: Starting AMB Reporter")

      const client = this.multiClient
        .getClientByChain(this.sourceChain === "goerli" ? goerli : mainnet)
        .extend(walletActions)
        .extend(publicActions)
      const reporterAddr = this.getSourceReporterAddr()
      const adapterAddr = this.getDestAdapter()
      const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`)
      const { result, request } = await client.simulateContract({
        account, // calling from account
        address: reporterAddr as `0x${string}`,
        abi: contractABI,
        functionName: "reportHeaders",
        args: [blockNumbers, adapterAddr, process.env.GAS],
      })

      const txhash = await client.writeContract(request)
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
