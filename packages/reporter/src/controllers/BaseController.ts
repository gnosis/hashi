import { Chain } from "viem"
import winston from "winston"

import Multiclient from "../MultiClient"

import { BaseControllerConfigs } from "../types"

class BaseController {
  name: string
  sourceChain: Chain
  destinationChains: Chain[]
  reporterAddress?: string
  adapterAddresses: { [chainName: string]: `0x${string}` }
  logger: winston.Logger
  multiClient: Multiclient

  constructor(configs: BaseControllerConfigs, name: string) {
    this.sourceChain = configs.sourceChain
    this.destinationChains = configs.destinationChains
    this.reporterAddress = configs.reporterAddress as `0x${string}`
    this.adapterAddresses = configs.adapterAddresses
    this.multiClient = configs.multiClient
    this.name = name

    this.logger = configs.logger.child({ service: this.name })
  }
}

export default BaseController
