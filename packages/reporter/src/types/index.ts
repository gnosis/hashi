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
  data: any // controller-specific data
  isLightClient: boolean
}

type BlockListenerConfig = {
  controllers: any[]
  logger: winston.Logger
  timeFetchBlocksMs: number
  LCTimeStoreHashesMs: number
  multiclient: Multiclient
  sourceChain: Chain
  queryBlockLength: number
  blockBuffer: number
}

export { ControllerConfig, BlockListenerConfig }
