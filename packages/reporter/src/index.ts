import * as chains from "viem/chains"
import { arbitrum, avalanche, bsc, bscTestnet, gnosis, optimism, optimismGoerli, polygon } from "viem/chains"
import { Chain } from "viem"

import Multiclient from "./MultiClient"
import AMBReporterController from "./controllers/AMBReporterController"
import OptimismReporterController from "./controllers/OptimismReporterController"
// import SygmaReporterController from "./controllers/SygmaReporterController"
import StandardReporterController from "./controllers/StandardReporterController"
import TelepathyReporterController from "./controllers/TelepathyReporterController"
import WormholeReporterController from "./controllers/WormholeReporterController"
import Coordinator from "./Coordinator"
import { settings } from "./settings/index"
import logger from "./utils/logger"

const main = () => {
  const controllersEnabled = process.env.REPORTERS_ENABLED?.split(",")
  const sourceChainId = Number(process.env.SOURCE_CHAIN_ID)
  const destinationChainIds = process.env.DESTINATION_CHAIN_IDS?.split(",").map((_chainId) => Number(_chainId))

  const sourceChain = Object.values(chains).find((_chain) => _chain.id === sourceChainId) as Chain
  const destinationChains = Object.values(chains).filter((_chain) => destinationChainIds?.includes(_chain.id))

  const unidirectionalAdaptersAddresses = settings.contractAddresses.adapterAddresses.unidirectional as any
  const unidirectionalReportersAddresses = settings.contractAddresses.reporterAddresses.unidirectional as any

  const multiClient = new Multiclient({
    chains: [sourceChain, ...destinationChains],
    privateKey: process.env.PRIVATE_KEY as `0x${string}`,
    rpcUrls: settings.rpcUrls,
  })

  const ambReporterController = new AMBReporterController({
    type: "classic",
    sourceChain,
    destinationChains: destinationChains.filter(({ name }) => name === gnosis.name),
    logger,
    multiClient,
    reporterAddress: unidirectionalReportersAddresses[sourceChain.name]?.Gnosis?.AMBReporter,
    adapterAddresses: {
      [gnosis.name]: unidirectionalAdaptersAddresses[sourceChain.name]?.Gnosis?.AMBAdapter,
    },
    reportHeadersGas: settings.reporterControllers.AMBReporterController.reportHeadersGas,
  })

  /*const sygmaReporterController = new SygmaReporterController({
    type: "classic",
    sourceChain,
    destinationChains,
    logger,
    multiClient,
    reporterAddress: settings.contractAddresses.Goerli.SygmaReporter,
    adapterAddresses: { [gnosis.name]: settings.contractAddresses.Gnosis.SygmaAdapter },
    reportHeadersToDomainValue: settings.reporterControllers.SygmaReporterController.reportHeadersToDomainValue,
    domainIds: settings.reporterControllers.SygmaReporterController.domainIds,
  })*/

  const telepathyReporterController = new TelepathyReporterController({
    type: "lightClient",
    sourceChain,
    destinationChains,
    logger,
    multiClient,
    adapterAddresses: {
      [gnosis.name]: unidirectionalAdaptersAddresses[sourceChain.name]?.Gnosis?.TelepathyAdapter,
      [arbitrum.name]: unidirectionalAdaptersAddresses[sourceChain.name]?.["Arbitrum One"]?.TelepathyAdapter,
      [optimism.name]: unidirectionalAdaptersAddresses[sourceChain.name]?.["OP Mainnet"]?.TelepathyAdapter,
      [bsc.name]: unidirectionalAdaptersAddresses[sourceChain.name]?.["BNB Smart Chain"]?.TelepathyAdapter,
      [polygon.name]: unidirectionalAdaptersAddresses[sourceChain.name]?.Polygon?.TelepathyAdapter,
    },
    baseProofUrl: settings.reporterControllers.TelepathyReporterController.baseProofUrl,
    lightClientAddresses: {
      [gnosis.name]: settings.contractAddresses.Gnosis.TelepathyLightClientMainnet,
      [arbitrum.name]: settings.contractAddresses["Arbitrum One"].TelepathyLightClientMainnet,
      [optimism.name]: settings.contractAddresses["OP Mainnet"].TelepathyLightClientMainnet,
      [bsc.name]: settings.contractAddresses["BNB Smart Chain"].TelepathyLightClientMainnet,
      [polygon.name]: settings.contractAddresses.Polygon.TelepathyLightClientMainnet,
    },
  })

  const wormholeReporterController = new WormholeReporterController({
    type: "classic",
    sourceChain,
    destinationChains,
    logger,
    multiClient,
    reporterAddress: (settings.contractAddresses.reporterAddresses as any)[sourceChain.name]?.WormholeHeaderReporter,
    adapterAddresses: {
      [gnosis.name]: (settings.contractAddresses.adapterAddresses as any)?.Gnosis?.WormholeAdapter,
      [optimism.name]: (settings.contractAddresses.adapterAddresses as any)["OP Mainnet"]?.WormholeAdapter,
      [bsc.name]: (settings.contractAddresses.adapterAddresses as any)["BNB Smart Chain"]?.WormholeAdapter,
      [polygon.name]: (settings.contractAddresses.adapterAddresses as any)?.Polygon.WormholeAdapter,
      [avalanche.name]: (settings.contractAddresses.adapterAddresses as any)?.Avalanche.WormholeAdapter,
    },
    wormholeScanBaseUrl: settings.reporterControllers.WormholeReporterController.wormholeScanBaseUrl,
    wormholeAddress: (settings.contractAddresses as any)[sourceChain.name]?.Wormhole,
    wormholeChainIds: settings.reporterControllers.WormholeReporterController.wormholeChainIds,
  })

  // TODO: add check to prevent to always run OptimismReporterController even when destinationChains does not include optimism
  const optimismReporterController = new OptimismReporterController({
    type: "native",
    sourceChain,
    logger,
    multiClient,
    reporterAddress:
      settings.contractAddresses.reporterAddresses.unidirectional.Ethereum["OP Mainnet"]
        .L1CrossDomainMessengerHeaderReporter,
    adapterAddresses: {
      [optimism.name]:
        settings.contractAddresses.adapterAddresses.unidirectional.Ethereum["OP Mainnet"].L2CrossDomainMessengerAdapter,
    },
  })

  const axelarReporterController = new StandardReporterController({
    name: "AxelarReporterController",
    type: "classic",
    sourceChain,
    destinationChains,
    logger,
    multiClient,
    reporterAddresses: {
      [bsc.name]: unidirectionalReportersAddresses[sourceChain.name]?.[bsc.name]?.AxelarReporter,
    },
    adapterAddresses: {
      [bsc.name]: unidirectionalAdaptersAddresses[sourceChain.name]?.[bsc.name]?.AxelarAdapter,
    },
    reportHeadersValue: settings.reporterControllers.AxelarReporterController.reportHeadersValue,
  })

  const connextReporterController = new StandardReporterController({
    name: "ConnextReporterController",
    type: "classic",
    sourceChain,
    destinationChains,
    logger,
    multiClient,
    reporterAddresses: {
      [gnosis.name]: unidirectionalReportersAddresses[sourceChain.name]?.[gnosis.name]?.ConnextReporter,
    },
    adapterAddresses: {
      [gnosis.name]: unidirectionalAdaptersAddresses[sourceChain.name]?.[gnosis.name]?.ConnextAdapter,
    },
  })

  const celerReporterController = new StandardReporterController({
    name: "CelerReporterController",
    type: "classic",
    sourceChain,
    destinationChains,
    logger,
    multiClient,
    reporterAddresses: {
      [polygon.name]: unidirectionalReportersAddresses[sourceChain.name]?.[polygon.name]?.CelerReporter,
    },
    adapterAddresses: {
      [polygon.name]: unidirectionalAdaptersAddresses[sourceChain.name]?.[polygon.name]?.CelerAdapter,
    },
    reportHeadersValue: settings.reporterControllers.CelerReporterController.reportHeadersValue,
  })

  const layerZeroReporterController = new StandardReporterController({
    name: "LayerZeroReporterController",
    type: "classic",
    sourceChain,
    destinationChains,
    logger,
    multiClient,
    reporterAddresses: {
      [avalanche.name]: unidirectionalReportersAddresses[sourceChain.name]?.[avalanche.name]?.LayerZeroReporter,
    },
    adapterAddresses: {
      [avalanche.name]: unidirectionalAdaptersAddresses[sourceChain.name]?.[avalanche.name]?.LayerZeroAdapter,
    },
    reportHeadersValue: settings.reporterControllers.LayerZeroReporterController.reportHeadersValue,
  })

  const hyperlaneReporterController = new StandardReporterController({
    name: "HyperlaneReporterController",
    type: "classic",
    sourceChain,
    destinationChains,
    logger,
    multiClient,
    reporterAddresses: {
      [bsc.name]: unidirectionalReportersAddresses[sourceChain.name]?.[bsc.name]?.HyperlaneReporter,
    },
    adapterAddresses: {
      [bsc.name]: unidirectionalAdaptersAddresses[sourceChain.name]?.[bsc.name]?.HyperlaneAdapter,
    },
  })

  const ccipReporterController = new StandardReporterController({
    name: "CCIPReporterController",
    type: "classic",
    sourceChain,
    destinationChains,
    logger,
    multiClient,
    reporterAddresses: {
      [optimismGoerli.name]: unidirectionalReportersAddresses[sourceChain.name]?.[optimismGoerli.name]?.CCIPReporter,
      [bscTestnet.name]: unidirectionalReportersAddresses[sourceChain.name]?.[bscTestnet.name]?.CCIPReporter,
    },
    adapterAddresses: {
      [optimismGoerli.name]: unidirectionalAdaptersAddresses[sourceChain.name]?.[optimismGoerli.name]?.CCIPAdapter,
      [bscTestnet.name]: unidirectionalAdaptersAddresses[sourceChain.name]?.[bscTestnet.name]?.CCIPAdapter,
    },
    reportHeadersValue: settings.reporterControllers.CCIPReporterController.reportHeadersValue,
  })

  const coordinator = new Coordinator({
    controllers: [
      ambReporterController,
      // sygmaReporterController,
      telepathyReporterController,
      wormholeReporterController,
      optimismReporterController,
      axelarReporterController,
      connextReporterController,
      celerReporterController,
      layerZeroReporterController,
      hyperlaneReporterController,
      ccipReporterController,
    ].filter((_controller) => controllersEnabled?.includes(_controller.name)),
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
