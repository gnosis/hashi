import { Chain } from "viem"
import winston = require("winston")

import Multiclient from "../MultiClient"

type BaseControllerConfigs = {
  sourceChain: Chain
  destinationChains: Chain[]
  reporterAddress?: string
  adapterAddresses: { [chainName: string]: `0x${string}` }
  logger: winston.Logger
  multiClient: Multiclient
}

interface TelepathyReporterControllerConfigs extends BaseControllerConfigs {
  lightClientAddresses: { [chainName: string]: `0x${string}` }
  baseProofUrl: string
  blockBuffer: number
  intervalFetchBlocksMs: number
}

interface AMBReporterControllerConfigs extends BaseControllerConfigs {
  reportHeadersGas: number
}

interface SygmaReporterControllerConfigs extends BaseControllerConfigs {
  reportHeadersToDomainMsgValue: string
  domainIds: { [chainName: string]: number }
}

interface BlockListenerConfigs {
  controllers: any[]
  logger: winston.Logger
  intervalFetchBlocksMs: number
  multiclient: Multiclient
  sourceChain: Chain
  queryBlockLength: number
  blockBuffer: number
}

export {
  AMBReporterControllerConfigs,
  BaseControllerConfigs,
  BlockListenerConfigs,
  SygmaReporterControllerConfigs,
  TelepathyReporterControllerConfigs,
}
