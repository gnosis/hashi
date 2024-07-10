import { Chain } from "viem"
import ABI from "../ABIs/AMBReporterContractABI.json" assert { type: "json" }

import BaseController from "./BaseController.js"

import { BaseControllerConfigs } from "./BaseController.js"

class AMBReporterController extends BaseController {
  constructor(_configs: BaseControllerConfigs) {
    super(_configs, "AMBReporterController")
  }

  async onBlocks(_blockNumbers: bigint[]) {
    try {
      const client = this.multiClient.getClientByChain(this.sourceChain)

      for (const chain of this.destinationChains as Chain[]) {
        const blockNumber = _blockNumbers[_blockNumbers.length - 1]

        this.logger.info(
          `reporting block header for block from ${_blockNumbers[0]} to ${_blockNumbers[_blockNumbers.length - 1]} on ${
            chain.name
          } ...`,
        )
        const { request } = await client.simulateContract({
          address: this.reporterAddress as `0x${string}`,
          abi: ABI,
          functionName: "dispatchBlocks",
          args: [chain.id, this.adapterAddresses[chain.name], [blockNumber]],
        })

        const txHash = await client.writeContract(request)
        this.logger.info(`headers reporter from ${this.sourceChain.name} to ${chain.name}: ${txHash}`)
      }
    } catch (_error) {
      this.logger.error(_error)
    }
  }
}

export default AMBReporterController
