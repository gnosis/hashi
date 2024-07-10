import { Chain, parseEther } from "viem"

import ABI from "../ABIs/SygmaReporterContractABI.json" assert { type: "json" }
import BaseController from "./BaseController.js"

import { BaseControllerConfigs } from "./BaseController.js"

class SygmaReporterController extends BaseController {
  constructor(_configs: BaseControllerConfigs) {
    super(_configs, "SygmaReporterController")
  }

  async onBlocks(_blockNumbers: bigint[]) {
    try {
      const client = this.multiClient.getClientByChain(this.sourceChain)
      const blockNumber = _blockNumbers[_blockNumbers.length - 1]

      for (const chain of this.destinationChains as Chain[]) {
        if (!this.adapterAddresses[chain.name]) continue

        this.logger.info(`reporting block header for block ${blockNumber} on ${chain.name} ...`)

        const { request } = await client.simulateContract({
          address: this.reporterAddresses[chain.name],
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

export default SygmaReporterController
