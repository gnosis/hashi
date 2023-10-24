import { parseEther, Chain } from "viem"
import winston from "winston"
import "dotenv/config"

import contractABI from "../ABIs/SygmaReporterContractABI.json"
import Multiclient from "../MultiClient"
import { ControllerConfig } from "../types/index"
import { settings } from "../settings"

class SygmaReporterController {
  sourceChain: Chain
  destinationChains: Chain[]
  name: string = "sygma"
  logger: winston.Logger
  multiClient: Multiclient
  reporterAddress: string
  adapterAddresses: { [chainName: string]: `0x${string}` }
  gas: string

  constructor(configs: ControllerConfig) {
    this.sourceChain = configs.sourceChain
    this.destinationChains = configs.destinationChains
    this.logger = configs.logger
    this.multiClient = configs.multiClient
    this.reporterAddress = configs.reporterAddress
    this.adapterAddresses = configs.adapterAddresses
    this.gas = configs.data
  }

  async onBlocks(blockNumbers: string[]) {
    try {
      this.logger.info("Sygma: Starting Sygma Reporter")
      const client = this.multiClient.getClientByChain(this.sourceChain)

      for (const chain of this.destinationChains) {
        const chainName = chain.name.toLocaleLowerCase()
        const { request } = await client.simulateContract({
          address: this.reporterAddress as `0x${string}`,
          abi: contractABI,
          functionName: "reportHeadersToDomain",
          args: [
            blockNumbers,
            this.adapterAddresses[chainName],
            settings.sygmaDomainID[chainName as keyof typeof settings.sygmaDomainID],
            "0x",
          ],
          value: parseEther(this.gas),
        })
        const txhash = await client.writeContract(request)
        this.logger.info(`Sygma: TxHash from Sygma Controller:  ${txhash}`)
      }
    } catch (error) {
      this.logger.error(`Sygma: Error from Sygma Controller: ${error}`)
    }
  }
}

export default SygmaReporterController
