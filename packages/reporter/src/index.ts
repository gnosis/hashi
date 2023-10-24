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
  const timeFetchBlocksMs = 5 * 60 * 1000 // modify the frequency here

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
    logger: logger,
    multiClient: multiClient,
    reporterAddress: settings.contractAddresses.goerli.AMBReporter,
    adapterAddress: { gnosis: settings.contractAddresses.gnosis.AMBAdapter },
  })
  const sygmaReporterController = new SygmaReporterController({
    sourceChain: goerli,
    destinationChains: [gnosis],
    logger: logger,
    multiClient: multiClient,
    reporterAddress: settings.contractAddresses.goerli.SygmaReporter,
    adapterAddress: { gnosis: settings.contractAddresses.gnosis.SygmaAdapter },
  })
  const telepathyReporterController = new TelepathyReporterController({
    sourceChain: goerli,
    destinationChains: [gnosis],
    logger: logger,
    multiClient: multiClient,
    reporterAddress: "",
    adapterAddress: { gnosis: settings.contractAddresses.gnosis.SygmaAdapter },
  })

  const controllersEnabled = process.env.REPORTERS_ENABLED?.split(",")
  const blocksListener = new BlocksListener({
    controllers: [ambReporterController, sygmaReporterController, telepathyReporterController].filter(
      (controller) => controllersEnabled?.includes(controller.name),
    ),
    timeFetchBlocksMs: timeFetchBlocksMs,
    logger: logger,
    multiclient: multiClient,
    sourceChain: goerli,
    queryBlockLength: 100, // modify the query block length here, <256
    lastProcessedBlock: 0n,
  })
  blocksListener.start()
}

main()
