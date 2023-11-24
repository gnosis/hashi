import { Chain, formatEther } from "viem"
import ABI from "../ABIs/AxelarHeaderReporter.json"

import BaseController from "./BaseController"

import { BaseControllerConfigs } from "./BaseController"

interface AxelaReporterControllerConfigs extends BaseControllerConfigs {}

class AxelarReporterController extends BaseController {
  constructor(_configs: AxelaReporterControllerConfigs) {
    super(_configs, "AxelarReporterController")
  }

  async onBlocks(_blockNumbers: bigint[]) {
    try {
      const client = this.multiClient.getClientByChain(this.sourceChain)

      for (const chain of this.destinationChains as Chain[]) {
        if (!this.adapterAddresses[chain.name]) continue

        const blockNumber = _blockNumbers[_blockNumbers.length - 1]

        this.logger.info(`reporting block header for block ${blockNumber} on ${chain.name} ...`)
        const { request } = await client.simulateContract({
          address: this.reporterAddress as `0x${string}`,
          abi: ABI,
          functionName: "reportHeaders",
          args: [[blockNumber], this.adapterAddresses[chain.name]],
          value: BigInt(0.0001 * 10 ** 18),
        })

        const txHash = await client.writeContract(request)
        this.logger.info(`headers reporter from ${this.sourceChain.name} to ${chain.name}: ${txHash}`)
      }
    } catch (_error) {
      this.logger.error(_error)
    }
  }
}

export default AxelarReporterController
