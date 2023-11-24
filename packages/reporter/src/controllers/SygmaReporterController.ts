import { Chain, parseEther } from "viem"

import ABI from "../ABIs/SygmaReporterContractABI.json"
import BaseController from "./BaseController"

import { BaseControllerConfigs } from "./BaseController"

interface SygmaReporterControllerConfigs extends BaseControllerConfigs {
  reportHeadersToDomainMsgValue: string
  domainIds: { [chainName: string]: number }
}

class SygmaReporterController extends BaseController {
  private _domainIds: { [chainName: string]: number }
  private _reportHeadersToDomainMsgValue: string

  constructor(_configs: SygmaReporterControllerConfigs) {
    super(_configs, "SygmaReporterController")
    this._domainIds = _configs.domainIds
    this._reportHeadersToDomainMsgValue = _configs.reportHeadersToDomainMsgValue
  }

  async onBlocks(_blockNumbers: bigint[]) {
    try {
      const client = this.multiClient.getClientByChain(this.sourceChain)

      for (const chain of this.destinationChains as Chain[]) {
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
          value: parseEther(this._reportHeadersToDomainMsgValue),
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
