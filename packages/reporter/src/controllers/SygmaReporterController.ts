import { parseEther, Chain } from "viem"
import winston from "winston"
import "dotenv/config"

import contractABI from "../ABIs/SygmaReporterContractABI.json"
import Multiclient from "../MultiClient"
import { ControllerConfig } from "../types/index"

class SygmaReporterController {
  sourceChain: Chain
  destinationChains: Chain[]
  name: string = "sygma"
  logger: winston.Logger
  multiClient: Multiclient
  reporterAddress: string
  adapterAddresses: { [chainName: string]: `0x${string}` }
  destinationDomainID: string
  fee: string

  constructor(configs: ControllerConfig) {
    this.sourceChain = configs.sourceChain
    this.destinationChains = configs.destinationChains
    this.logger = configs.logger
    this.multiClient = configs.multiClient
    this.reporterAddress = configs.reporterAddress !== undefined ? configs.reporterAddress : ""
    this.adapterAddresses = configs.adapterAddresses
    this.destinationDomainID = configs.data.destDomainID
    this.fee = configs.data.fee
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
            this.destinationDomainID[chainName as keyof typeof this.destinationDomainID],
            "0x",
          ],
          value: parseEther(this.fee),
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
