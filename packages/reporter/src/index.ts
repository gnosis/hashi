import { gnosis, goerli } from "viem/chains"
import winston from "winston"
import "dotenv/config"

import Multiclient from "./MultiClient"
import AMBReporterController from "./controllers/AMBReporterController"
import SygmaReporterController from "./controllers/SygmaReporterController"
import TelepathyReporterController from "./controllers/TelepathyReporterController"
import BlocksListener from "./BlockListener"
import { settings } from "./settings/index"

function main() {
  const goerliRPC = process.env.GOERLI_RPC_URL as string
  const gnosisRPC = process.env.GNOSIS_RPC_URL as string
  const privKey = process.env.PRIVATE_KEY as `0x${string}`
  const queryBlockLength = Number(settings.blockListener.queryBlockLength)
  const blockBuffer = Number(settings.blockListener.blockBuffer)

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
    reporterAddress: settings.contractAddresses.goerli.AMBReporter,
    adapterAddresses: { gnosis: settings.contractAddresses.gnosis.AMBAdapter as `0x${string}` },
    data: { gas: settings.reporterController.ambReporterController.gas },
  })
  const sygmaReporterController = new SygmaReporterController({
    sourceChain: goerli,
    destinationChains: [gnosis],
    logger,
    multiClient,
    reporterAddress: settings.contractAddresses.goerli.SygmaReporter,
    adapterAddresses: { gnosis: settings.contractAddresses.gnosis.SygmaAdapter as `0x${string}` },
    data: {
      fee: settings.reporterController.sygmaReporterController.data,
      destDomainID: settings.reporterController.sygmaReporterController.domainID,
    },
  })
  const telepathyReporterController = new TelepathyReporterController({
    sourceChain: goerli,
    destinationChains: [gnosis],
    logger,
    multiClient,
    adapterAddresses: { gnosis: settings.contractAddresses.gnosis.SygmaAdapter as `0x${string}` },
    data: {
      proofURL: settings.reporterController.telepathyReporterController.proofURL,
      lightClientAddresses: { gnosis: settings.contractAddresses.gnosis.TelepathyLightClient },
      queryBlockLength: settings.reporterController.telepathyReporterController.queryBlockLength,
      blockBuffer: settings.reporterController.telepathyReporterController.blockBuffer,
    },
  })

  if (queryBlockLength > 256 - blockBuffer) {
    throw logger.error(`Please choose a block length less than ${256 - Number(settings.blockListener.blockBuffer)}!`)
  }

  const controllersEnabled = process.env.REPORTERS_ENABLED?.split(",")
  const blocksListener = new BlocksListener({
    controllers: [ambReporterController, sygmaReporterController, telepathyReporterController].filter(
      (controller) => controllersEnabled?.includes(controller.name),
    ),
    timeFetchBlocksMs: Number(settings.blockListener.timeFetchBlocksMs),
    logger,
    multiclient: multiClient,
    sourceChain: goerli,
    queryBlockLength, // modify the query block length here, <256 - block buffer
    blockBuffer,
  })
  blocksListener.start()
}

main()
