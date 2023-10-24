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
  adapterAddress: { [chainName: string]: string }
  gas: string
  constructor(props: ControllerConfig) {
    this.sourceChain = props.sourceChain
    this.destinationChains = props.destinationChains
    this.logger = props.logger
    this.multiClient = props.multiClient
    this.reporterAddress = props.reporterAddress
    this.adapterAddress = props.adapterAddress
    this.gas = props.data
  }

  async onBlocks(blockNumbers: string[]) {
    try {
      this.logger.info("Sygma: Starting Sygma Reporter")
      const client = this.multiClient.getClientByChain(this.sourceChain)

      for (const chain of this.destinationChains) {
        const chainName = chain.name.toLocaleLowerCase()
        const { result, request } = await client.simulateContract({
          address: this.reporterAddress as `0x${string}`,
          abi: contractABI,
          functionName: "reportHeadersToDomain",
          args: [
            blockNumbers,
            this.adapterAddress[chainName],
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
