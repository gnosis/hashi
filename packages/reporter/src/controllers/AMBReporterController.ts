import ABI from "../ABIs/AMBReporterContractABI.json"

import BaseController from "./BaseController"

import { BaseControllerConfigs } from "./BaseController"

interface AMBReporterControllerConfigs extends BaseControllerConfigs {
  reportHeadersGas: number
}

class AMBReporterController extends BaseController {
  private _reportHeadersGas: number

  constructor(_configs: AMBReporterControllerConfigs) {
    super(_configs, "AMBReporterController")
    this._reportHeadersGas = _configs.reportHeadersGas
  }

  async onBlocks(_blockNumbers: bigint[]) {
    try {
      const client = this.multiClient.getClientByChain(this.sourceChain)

      for (const chain of this.destinationChains) {
        const blockNumber = _blockNumbers[_blockNumbers.length - 1]

        this.logger.info(`reporting block header for block ${blockNumber} on ${chain.name} ...`)
        const { request } = await client.simulateContract({
          address: this.reporterAddress as `0x${string}`,
          abi: ABI,
          functionName: "reportHeaders",
          args: [[blockNumber], this.adapterAddresses[chain.name], this._reportHeadersGas],
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
