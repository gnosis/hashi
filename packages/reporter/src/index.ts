import * as chains from "viem/chains"
import { gnosis } from "viem/chains"
import { Chain } from "viem"

import Multiclient from "./MultiClient"
import AMBReporterController from "./controllers/AMBReporterController"
import SygmaReporterController from "./controllers/SygmaReporterController"
import TelepathyReporterController from "./controllers/TelepathyReporterController"
import BlocksListener from "./BlockListener"
import { settings } from "./settings/index"
import logger from "./utils/logger"

const main = () => {
  const controllersEnabled = process.env.REPORTERS_ENABLED?.split(",")
  const sourceChainId = Number(process.env.SOURCE_CHAIN_ID)
  const destinationChainIds = process.env.DESTINATION_CHAIN_IDS?.split(",").map((_chainId) => Number(_chainId))

  const sourceChain = Object.values(chains).find((_chain) => _chain.id === sourceChainId) as Chain
  const destinationChains = Object.values(chains).filter((_chain) => destinationChainIds?.includes(_chain.id))

  const multiClient = new Multiclient({
    chains: [sourceChain, ...destinationChains],
    privateKey: process.env.PRIVATE_KEY as `0x${string}`,
    rpcUrls: {
      goerli: settings.rpcUrls.Gnosis,
      gnosis: settings.rpcUrls.Goerli,
    },
  })

  const ambReporterController = new AMBReporterController({
    sourceChain,
    destinationChains,
    logger,
    multiClient,
    reporterAddress: settings.contractAddresses.Goerli.AMBReporter,
    adapterAddresses: { [gnosis.name]: settings.contractAddresses.Gnosis.AMBAdapter },
    reportHeadersGas: settings.reporterControllers.AMBReporterController.reportHeadersGas,
  })

  const sygmaReporterController = new SygmaReporterController({
    sourceChain,
    destinationChains,
    logger,
    multiClient,
    reporterAddress: settings.contractAddresses.Goerli.SygmaReporter,
    adapterAddresses: { [gnosis.name]: settings.contractAddresses.Gnosis.SygmaAdapter },
    reportHeadersToDomainMsgValue: settings.reporterControllers.SygmaReporterController.reportHeadersToDomainMsgValue,
    domainIds: settings.reporterControllers.SygmaReporterController.domainIds,
  })

  const telepathyReporterController = new TelepathyReporterController({
    sourceChain,
    destinationChains,
    logger,
    multiClient,
    adapterAddresses: { [gnosis.name]: settings.contractAddresses.Gnosis.SygmaAdapter },
    baseProofUrl: settings.reporterControllers.TelepathyReporterController.baseProofUrl,
    lightClientAddresses: { [gnosis.name]: settings.contractAddresses.Gnosis.TelepathyLightClient },
    blockBuffer: settings.reporterControllers.TelepathyReporterController.blockBuffer,
    intervalFetchHeadUpdates: settings.reporterControllers.TelepathyReporterController.intervalFetchHeadUpdates,
  })

  const blocksListener = new BlocksListener({
    controllers: [ambReporterController, sygmaReporterController].filter(
      (_controller) => controllersEnabled?.includes(_controller.name),
    ),
    intervalFetchBlocksMs: settings.BlockListener.intervalFetchBlocksMs,
    logger,
    multiclient: multiClient,
    sourceChain,
    queryBlockLength: settings.BlockListener.queryBlockLength,
    blockBuffer: settings.BlockListener.blockBuffer,
  })

  blocksListener.start()

  if (controllersEnabled?.includes(telepathyReporterController.name)) {
    telepathyReporterController.start()
  }
}

main()
