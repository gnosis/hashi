import { Chain, parseEther } from "viem"

import ABI from "../ABIs/SygmaReporterContractABI.json"
import BaseController from "./BaseController"

import { BaseControllerConfigs } from "./BaseController"

interface SygmaReporterControllerConfigs extends BaseControllerConfigs {
  reportHeadersToDomainValue: bigint
  domainIds: { [chainName: string]: number }
}

class SygmaReporterController extends BaseController {
  private _domainIds: { [chainName: string]: number }
  private _reportHeadersToDomainValue: bigint

  constructor(_configs: SygmaReporterControllerConfigs) {
    super(_configs, "SygmaReporterController")
    this._domainIds = _configs.domainIds
    this._reportHeadersToDomainValue = _configs.reportHeadersToDomainValue
  }

  async onBlocks(_blockNumbers: bigint[]) {
    try {
      const client = this.multiClient.getClientByChain(this.sourceChain)

      for (const chain of this.destinationChains as Chain[]) {
        if (!this.adapterAddresses[chain.name]) continue

        this.logger.info(
          `reporting block headers of blocks [${_blockNumbers[0]},${_blockNumbers[_blockNumbers.length - 1]}] on ${
            chain.name
          } ...`,
        )

        const { request } = await client.simulateContract({
          address: this.reporterAddress as `0x${string}`,
          abi: ABI,
          functionName: "reportHeadersToDomain",
          args: [
            _blockNumbers,
            this.adapterAddresses[chain.name],
            this._domainIds[chain.name as keyof typeof this._domainIds],
            "0x",
          ],
          value: this._reportHeadersToDomainValue,
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
