import { Chain } from "viem"
import winston = require("winston")
import Multiclient from "../MultiClient"

type ControllerConfig = {
  sourceChain: Chain
  destinationChains: Chain[]
  reporterAddress: string
  adapterAddress: { [chainName: string]: string }
  logger: winston.Logger
  multiClient: Multiclient
  isEnabled: boolean
}

type BlockListenerConfig = {
  controllers: any[]
  logger: winston.Logger
  timeFetchBlocksMs: number
  multiclient: Multiclient
  sourceChain: Chain
  queryBlockLength: number
  lastProcessedBlock: bigint
}

export { ControllerConfig, BlockListenerConfig }
