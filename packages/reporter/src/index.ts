import * as chains from "viem/chains"
import { gnosis, goerli } from "viem/chains"
import { Chain } from "viem"

import Multiclient from "./MultiClient"
import AMBReporterController from "./controllers/AMBReporterController"
import SygmaReporterController from "./controllers/SygmaReporterController"
import TelepathyReporterController from "./controllers/TelepathyReporterController"
import Coordinator from "./Coordinator"
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
      [goerli.name]: settings.rpcUrls.Goerli,
      [gnosis.name]: settings.rpcUrls.Gnosis,
    },
  })

  const ambReporterController = new AMBReporterController({
    type: "classic",
    sourceChain,
    destinationChains,
    logger,
    multiClient,
    reporterAddress: settings.contractAddresses.Goerli.AMBReporter,
    adapterAddresses: { [gnosis.name]: settings.contractAddresses.Gnosis.AMBAdapter },
    reportHeadersGas: settings.reporterControllers.AMBReporterController.reportHeadersGas,
  })

  const sygmaReporterController = new SygmaReporterController({
    type: "classic",
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
    type: "lightClient",
    sourceChain,
    destinationChains,
    logger,
    multiClient,
    adapterAddresses: { [gnosis.name]: settings.contractAddresses.Gnosis.SygmaAdapter },
    baseProofUrl: settings.reporterControllers.TelepathyReporterController.baseProofUrl,
    lightClientAddresses: { [gnosis.name]: settings.contractAddresses.Gnosis.TelepathyLightClient },
  })

  const coordinator = new Coordinator({
    controllers: [ambReporterController, sygmaReporterController, telepathyReporterController].filter(
      (_controller) => controllersEnabled?.includes(_controller.name),
    ),
    intervalFetchBlocksMs: settings.Coordinator.intervalFetchBlocksMs,
    logger,
    multiclient: multiClient,
    sourceChain,
    queryBlockLength: settings.Coordinator.queryBlockLength,
    blockBuffer: settings.Coordinator.blockBuffer,
    intervalsUpdateLightClients: settings.Coordinator.intervalsUpdateLightClients,
  })

  coordinator.start()
}

main()
