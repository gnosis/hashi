import { Chain } from "viem"
import winston from "winston"

import contractABI from "../ABIs/AMBReporterContractABI.json"
import Multiclient from "../MultiClient"
import { ControllerConfig } from "../types/index"

class AMBReporterController {
  sourceChain: Chain
  destinationChains: Chain[]
  name: string = "amb"
  logger: winston.Logger
  multiClient: Multiclient
  interval: number
  reporterAddress: `0x${string}`
  adapterAddresses: { [chainName: string]: `0x${string}` }
  gas: string

  constructor(configs: ControllerConfig) {
    this.sourceChain = configs.sourceChain
    this.destinationChains = configs.destinationChains
    this.logger = configs.logger
    this.multiClient = configs.multiClient
    this.interval = configs.interval
    this.reporterAddress = configs.reporterAddress as `0x${string}`
    this.adapterAddresses = configs.adapterAddresses
    this.gas = configs.data.gas
  }

  async onBlocks(blockNumbers: bigint[]) {
    try {
      this.logger.info("AMB: Starting AMB Reporter")

      const client = this.multiClient.getClientByChain(this.sourceChain)

      for (const chain of this.destinationChains) {
        let chainName = chain.name.toLocaleLowerCase()
        const { request } = await client.simulateContract({
          address: this.reporterAddress as `0x${string}`,
          abi: contractABI,
          functionName: "reportHeaders",
          args: [blockNumbers, this.adapterAddresses[chainName], this.gas],
        })

        const txhash = await client.writeContract(request)
        this.logger.info(`AMB: TxHash from AMB Controller:  ${txhash} on ${chain.name}`)
        this.logger.info(`Restarting AMB in ${this.interval / 1000} seconds`)
      }
    } catch (error) {
      this.logger.error(`AMB: Error from AMB Controller: ${error}`)
    }
  }
}

export default AMBReporterController
