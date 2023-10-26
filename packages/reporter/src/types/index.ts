import { Chain } from "viem"
import winston = require("winston")

import Multiclient from "../MultiClient"

type ControllerConfig = {
  sourceChain: Chain
  destinationChains: Chain[]
  reporterAddress?: string
  adapterAddresses: { [chainName: string]: `0x${string}` }
  logger: winston.Logger
  multiClient: Multiclient
  interval: number
  data: any // controller-specific data
}

type BlockListenerConfig = {
  controllers: any[]
  logger: winston.Logger
  timeFetchBlocksMs: number
  multiclient: Multiclient
  sourceChain: Chain
  queryBlockLength: number
  blockBuffer: number
}

export { ControllerConfig, BlockListenerConfig }
