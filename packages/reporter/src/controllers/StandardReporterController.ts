import { Chain, formatEther } from "viem"
import ABI from "../ABIs/StandardReporterContractABI.json" assert { type: "json" }

import BaseController from "./BaseController.js"

import { BaseControllerConfigs } from "./BaseController.js"

interface StandardReporterControllerConfigs extends BaseControllerConfigs {
  name: string
  reportHeadersValue?: bigint
}

class StandardReporterController extends BaseController {
  private _reportHeadersValue: bigint

  constructor(_configs: StandardReporterControllerConfigs) {
    super(_configs, _configs.name)

    this._reportHeadersValue = _configs.reportHeadersValue || BigInt(0)
  }

  async onBlocks(_blockNumbers: bigint[]) {
    try {
      const client = this.multiClient.getClientByChain(this.sourceChain)
      const blockNumber = _blockNumbers[_blockNumbers.length - 1]

      let nonce = await client.getTransactionCount({ address: client.account.address })
      for (const chain of this.destinationChains as Chain[]) {
        if (!this.adapterAddresses[chain.name]) {
          this.logger.info(`Adapter address is missing for ${chain.name}. Skipping...`)
          continue
        }

        this.logger.info(`reporting block header for block ${blockNumber} on ${chain.name} ...`)
        const { request } = await client.simulateContract({
          address: this.reporterAddresses[chain.name],
          abi: ABI,
          functionName: "dispatchBlocks",
          args: [chain.id, this.adapterAddresses[chain.name], [blockNumber]],
          value: this._reportHeadersValue,
          nonce,
        })

        const txHash = await client.writeContract(request)
        this.logger.info(`headers reporter from ${this.sourceChain.name} to ${chain.name}: ${txHash}`)
        nonce += 1
      }
    } catch (_error) {
      this.logger.error(_error)
    }
  }
}

export default StandardReporterController
