import { gnosis, goerli, mainnet } from "viem/chains"
import Multiclient from "./MultiClient"
import AMBReporterController from "./controllers/AMBReporterController"
import SygmaReporterController from "./controllers/SygmaReporterController"
import TelepathyReporterController from "./controllers/TelepathyReporterController"
import BlocksListener from "./BlockListener"
import "dotenv/config"
import winston from "winston"
import settings from "./utils/settings.json"
function main() {
  const goerliRPC = process.env.GOERLI_RPC_URL as string
  const gnosisRPC = process.env.GNOSIS_RPC_URL as string
  const sourceChain = process.env.SOURCE_CHAIN
  const destChain = process.env.DEST_CHAIN
  const privKey = process.env.PRIVATE_KEY as `0x${string}`
  const isAMBEnabled = process.env.AMB_CONTROLLER === "true"
  const isSygmaEnabled = process.env.SYGMA_CONTROLLER === "true"
  const isTelepathyEnabled = process.env.TELEPATHY_CONTROLLER === "true"
  const timeFetchBlocksMs = 10 * 1000

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
    isEnabled: isAMBEnabled,
    logger: logger,
    multiClient: multiClient,
    reporterAddress: settings.contractAddresses.goerli.AMBReporter,
    adapterAddress: { gnosis: settings.contractAddresses.gnosis.AMBAdapter },
  })
  const sygmaReporterController = new SygmaReporterController({
    sourceChain: goerli,
    destinationChains: [gnosis],
    isEnabled: isSygmaEnabled,
    logger: logger,
    multiClient: multiClient,
    reporterAddress: settings.contractAddresses.goerli.SygmaReporter,
    adapterAddress: { gnosis: settings.contractAddresses.gnosis.SygmaAdapter },
  })
  const telepathyReporterController = new TelepathyReporterController({
    sourceChain: goerli,
    destinationChains: [gnosis],
    isEnabled: isTelepathyEnabled,
    logger: logger,
    multiClient: multiClient,
    reporterAddress: "",
    adapterAddress: { gnosis: settings.contractAddresses.gnosis.SygmaAdapter },
  })

  const blocksListener = new BlocksListener({
    controllers: [ambReporterController, sygmaReporterController, telepathyReporterController].filter(
      (controller) => controller.isEnabled == true,
    ),
    timeFetchBlocksMs: timeFetchBlocksMs,
    logger: logger,
    multiclient: multiClient,
    sourceChain: goerli,
    queryBlockLength: 100,
    lastProcessedBlock: 0n,
  })
  blocksListener.start()
}

main()
