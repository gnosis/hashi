import { optimism } from "viem/chains"

import ABI from "../ABIs/L1CrossDomainMessengerHeaderReporterABI.json" assert { type: "json" }
import BaseController from "./BaseController.js"

import { BaseControllerConfigs } from "./BaseController.js"

interface OptimismReporterControllerConfigs extends BaseControllerConfigs {}

class OptimismReporterController extends BaseController {
  constructor(_configs: OptimismReporterControllerConfigs) {
    super(_configs, "OptimismReporterController")
  }

  async onBlocks(_blockNumbers: bigint[]) {
    try {
      const client = this.multiClient.getClientByChain(this.sourceChain)
      const blockNumber = _blockNumbers[_blockNumbers.length - 1]

      this.logger.info(`reporting block header for block ${blockNumber} on ${optimism.name} ...`)
      const { request } = await client.simulateContract({
        address: this.reporterAddress as `0x${string}`,
        abi: ABI,
        functionName: "reportHeaders",
        args: [[blockNumber], this.adapterAddresses[optimism.name]],
        gas: 300000n, // NOTE: if we don't put the gas here, the tx fails because of out of gas
      })

      const txHash = await client.writeContract(request)
      this.logger.info(`headers reporter from ${this.sourceChain.name} to ${optimism.name}: ${txHash}`)
    } catch (_error) {
      this.logger.error(_error)
    }
  }
}

export default OptimismReporterController
