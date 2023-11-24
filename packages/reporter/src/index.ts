import * as chains from "viem/chains"
import { avalanche, gnosis, mainnet, goerli, polygon, optimism, bsc, arbitrum } from "viem/chains"
import { Chain } from "viem"

import Multiclient from "./MultiClient"
import AMBReporterController from "./controllers/AMBReporterController"
import AxelarReporterController from "./controllers/AxelarReporterController"
import OptimismReporterController from "./controllers/OptimismReporterController"
import SygmaReporterController from "./controllers/SygmaReporterController"
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

  const multiClient = new Multiclient({
    chains: [sourceChain, ...destinationChains],
    privateKey: process.env.PRIVATE_KEY as `0x${string}`,
    rpcUrls: {
      [goerli.name]: settings.rpcUrls.Goerli,
      [gnosis.name]: settings.rpcUrls.Gnosis,
      [mainnet.name]: settings.rpcUrls.Ethereum,
      [arbitrum.name]: settings.rpcUrls["Arbitrum One"],
      [optimism.name]: settings.rpcUrls["OP Mainnet"],
      [bsc.name]: settings.rpcUrls["BNB Smart Chain"],
      [polygon.name]: settings.rpcUrls.Polygon,
    },
  })

  const ambReporterController = new AMBReporterController({
    type: "classic",
    sourceChain,
    destinationChains: destinationChains.filter(({ name }) => name === gnosis.name),
    logger,
    multiClient,
    reporterAddress: settings.contractAddresses.Goerli.AMBReporter,
    adapterAddresses: {
      [gnosis.name]: settings.contractAddresses.Gnosis.AMBAdapter,
    },
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
    adapterAddresses: {
      [gnosis.name]: settings.contractAddresses.Gnosis.TelepathyAdapter,
      [arbitrum.name]: settings.contractAddresses["Arbitrum One"].TelepathyAdapter,
      [optimism.name]: settings.contractAddresses["OP Mainnet"].TelepathyAdapter,
      [bsc.name]: settings.contractAddresses["BNB Smart Chain"].TelepathyAdapter,
      [polygon.name]: settings.contractAddresses.Polygon.TelepathyAdapter,
    },
    baseProofUrl: settings.reporterControllers.TelepathyReporterController.baseProofUrl,
    lightClientAddresses: {
      [gnosis.name]: settings.contractAddresses.Gnosis.TelepathyLightClient,
      [arbitrum.name]: settings.contractAddresses["Arbitrum One"].TelepathyLightClient,
      [optimism.name]: settings.contractAddresses["OP Mainnet"].TelepathyLightClient,
      [bsc.name]: settings.contractAddresses["BNB Smart Chain"].TelepathyLightClient,
      [polygon.name]: settings.contractAddresses.Polygon.TelepathyLightClient,
    },
  })

  const wormholeReporterController = new WormholeReporterController({
    type: "classic",
    sourceChain,
    destinationChains,
    logger,
    multiClient,
    reporterAddress: settings.contractAddresses.Ethereum.WormholeHeaderReporter,
    adapterAddresses: {
      [gnosis.name]: settings.contractAddresses.Gnosis.WormholeAdapter,
      [optimism.name]: settings.contractAddresses["OP Mainnet"].WormholeAdapter,
      [bsc.name]: settings.contractAddresses["BNB Smart Chain"].WormholeAdapter,
      [polygon.name]: settings.contractAddresses.Polygon.WormholeAdapter,
      [avalanche.name]: settings.contractAddresses.Avalanche.WormholeAdapter,
    },
    wormholeScanBaseUrl: settings.reporterControllers.WormholeReporterController.wormholeScanBaseUrl,
    wormholeAddress: (settings.contractAddresses as any)[sourceChain.name].Wormhole,
    wormholeChainIds: settings.reporterControllers.WormholeReporterController.wormholeChainIds,
  })

  // TODO: add check to prevent to always run OptimismReporterController even when destinationChains does not include optimism
  const optimismReporterController = new OptimismReporterController({
    type: "native",
    sourceChain,
    logger,
    multiClient,
    reporterAddress: settings.contractAddresses.Ethereum.L1CrossDomainMessengerHeaderReporter,
    adapterAddresses: {
      [optimism.name]: settings.contractAddresses["OP Mainnet"].L2CrossDomainMessengerAdapter,
    },
  })

  const axelarReporterControllerMainnetBsc = new AxelarReporterController({
    type: "classic",
    sourceChain,
    destinationChains,
    logger,
    multiClient,
    reporterAddress: settings.contractAddresses.Ethereum.AxelarReporterBsc,
    adapterAddresses: {
      [bsc.name]: settings.contractAddresses["BNB Smart Chain"].AxelarAdapterMainnet,
    },
  })

  const coordinator = new Coordinator({
    controllers: [
      ambReporterController,
      sygmaReporterController,
      telepathyReporterController,
      wormholeReporterController,
      optimismReporterController,
      axelarReporterControllerMainnetBsc,
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
