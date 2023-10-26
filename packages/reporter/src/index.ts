import { gnosis, goerli } from "viem/chains"
import winston from "winston"

import Multiclient from "./MultiClient"
import AMBReporterController from "./controllers/AMBReporterController"
import SygmaReporterController from "./controllers/SygmaReporterController"
import TelepathyReporterController from "./controllers/TelepathyReporterController"
import BlocksListener from "./BlockListener"
import { settings } from "./settings/index"

function main() {
  const goerliRPC = settings.config.goerliRPC as string
  const gnosisRPC = settings.config.gnosisRPC as string
  const privKey = settings.config.privKey as `0x${string}`
  const queryBlockLength = Number(settings.blockListener.queryBlockLength)
  const blockBuffer = Number(settings.blockListener.blockBuffer)
  const timeFetchBlocksMs = Number(settings.blockListener.timeFetchBlocksMs)
  const LCTimeStoreHashesMs = Number(settings.blockListener.LCTimeStoreHashesMs)

  const logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
  })
  const multiClient = new Multiclient({
    chains: [goerli, gnosis],
    privateKey: privKey,
    rpcUrls: {
      goerli: goerliRPC,
      gnosis: gnosisRPC,
    },
  })

  const ambReporterController = new AMBReporterController({
    sourceChain: goerli,
    destinationChains: [gnosis],
    logger,
    multiClient,
    isLightClient: false,
    reporterAddress: settings.contractAddresses.goerli.AMBReporter,
    adapterAddresses: { gnosis: settings.contractAddresses.gnosis.AMBAdapter as `0x${string}` },
    data: { gas: settings.reporterControllers.AMBReporterController.gas },
  })
  const sygmaReporterController = new SygmaReporterController({
    sourceChain: goerli,
    destinationChains: [gnosis],
    logger,
    multiClient,
    isLightClient: false,
    reporterAddress: settings.contractAddresses.goerli.SygmaReporter,
    adapterAddresses: { gnosis: settings.contractAddresses.gnosis.SygmaAdapter as `0x${string}` },
    data: {
      fee: settings.reporterControllers.SygmaReporterController.data,
      destDomainID: settings.reporterControllers.SygmaReporterController.domainID,
    },
  })
  const telepathyReporterController = new TelepathyReporterController({
    sourceChain: goerli,
    destinationChains: [gnosis],
    logger,
    multiClient,
    isLightClient: true,
    adapterAddresses: { gnosis: settings.contractAddresses.gnosis.SygmaAdapter as `0x${string}` },
    data: {
      baseProofUrl: settings.reporterControllers.TelepathyReporterController.baseProofUrl,
      lightClientAddresses: { gnosis: settings.contractAddresses.gnosis.TelepathyLightClient },
      blockBuffer: settings.reporterControllers.TelepathyReporterController.blockBuffer,
    },
  })

  const controllersEnabled = process.env.REPORTERS_ENABLED?.split(",")

  const blocksListener = new BlocksListener({
    controllers: [ambReporterController, sygmaReporterController, telepathyReporterController].filter(
      (controller) => controllersEnabled?.includes(controller.name),
    ),
    timeFetchBlocksMs,
    LCTimeStoreHashesMs,
    logger,
    multiclient: multiClient,
    sourceChain: goerli,
    queryBlockLength, // modify the query block length here, <256 - block buffer
    blockBuffer,
  })

  blocksListener.start()
}

main()
