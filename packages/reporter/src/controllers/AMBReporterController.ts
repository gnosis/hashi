import { Chain } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import winston from "winston"
import "dotenv/config"

import contractABI from "../ABIs/AMBReporterContractABI.json"
import Multiclient from "../MultiClient"
import { ControllerConfig } from "../types/index"

class AMBReporterController {
  sourceChain: Chain
  destinationChains: Chain[]
  name: string = "amb"
  logger: winston.Logger
  multiClient: Multiclient
  reporterAddr: string
  adapterAddr: { [chainName: string]: string }
  constructor(props: ControllerConfig) {
    this.sourceChain = props.sourceChain
    this.destinationChains = props.destinationChains
    this.logger = props.logger
    this.multiClient = props.multiClient
    this.reporterAddr = props.reporterAddress
    this.adapterAddr = props.adapterAddress
  }

  async onBlocks(blockNumbers: bigint[]) {
    try {
      this.logger.info("AMB: Starting AMB Reporter")

      const client = this.multiClient.getClientByChain(this.sourceChain)

      const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`)

      for (const chain of this.destinationChains) {
        let chainName = chain.name.toLocaleLowerCase()
        const { result, request } = await client.simulateContract({
          account, // calling from account
          address: this.reporterAddr as `0x${string}`,
          abi: contractABI,
          functionName: "reportHeaders",
          args: [blockNumbers, this.adapterAddr[chainName], process.env.GAS],
        })

        const txhash = await client.writeContract(request)
        this.logger.info(`AMB: TxHash from AMB Controller:  ${txhash}`)
      }
    } catch (error) {
      this.logger.error(`AMB: Error from AMB Controller: ${error}`)
    }
  }
}

export default AMBReporterController
