import { parseEther, Chain } from "viem"
import { gnosis } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import winston from "winston"
import "dotenv/config"

import contractABI from "../ABIs/SygmaReporterContractABI.json"
import Multiclient from "../MultiClient"
import { ControllerConfig } from "../utils/type"

class SygmaReporterController {
  sourceChain: Chain
  destinationChains: Chain[]
  isEnabled: boolean = false
  logger: winston.Logger
  multiClient: Multiclient
  reporterAddr: string
  adapterAddr: { [chainName: string]: string }
  constructor(props: ControllerConfig) {
    this.sourceChain = props.sourceChain
    this.destinationChains = props.destinationChains
    this.isEnabled = props.isEnabled
    this.logger = props.logger
    this.multiClient = props.multiClient
    this.reporterAddr = props.reporterAddress
    this.adapterAddr = props.adapterAddress
  }

  async onBlocks(blockNumbers: string[]) {
    try {
      this.logger.info("Sygma: Starting Sygma Reporter")
      const client = this.multiClient.getClientByChain(this.sourceChain)

      const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`)

      for (const chain of this.destinationChains) {
        const destDomainId = this.getDomainID(chain)
        const { result, request } = await client.simulateContract({
          account, // calling from account
          address: this.reporterAddr as `0x${string}`,
          abi: contractABI,
          functionName: "reportHeadersToDomain",
          args: [blockNumbers, this.adapterAddr[chain.name.toLocaleLowerCase()], destDomainId, "0x"],
          value: parseEther("0.0001"),
        })
        const txhash = await client.writeContract(request)
        this.logger.info(`Sygma: TxHash from Sygma Controller:  ${txhash}`)
      }
    } catch (error) {
      this.logger.error(`Sygma: Error from Sygma Controller: ${error}`)
    }
  }

  getDomainID(destinationChain: Chain) {
    switch (destinationChain) {
      case gnosis:
        return 101
      default:
        return 101
    }
  }
}

export default SygmaReporterController
