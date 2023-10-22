import { gnosis, goerli, mainnet } from "viem/chains"
import Multiclient from "./MultiClient"
import AMBController from "./controller/AMBController"
import SygmaController from "./controller/SygmaController"
import TelepathyController from "./controller/TelepathyController"
import BlocksListener from "./BlockListener"
import "dotenv/config"
import winston from "winston"

function main() {
  const goerliRPC = process.env.GOERLI_RPC_URL as string
  const gnosisRPC = process.env.GNOSIS_RPC_URL as string
  const sourceChain = process.env.SOURCE_CHAIN
  const destChain = process.env.DEST_CHAIN
  const privKey = process.env.PRIVATE_KEY as `0x${string}`
  const isAMBEnabled = process.env.AMB_CONTROLLER === "true"
  const isSygmaEnabled = process.env.SYGMA_CONTROLLER === "true"
  const isTelepathyEnabled = process.env.TELEPATHY_CONTROLLER === "true"
  const timeFetchBlocksMs = 5 * 60 * 1000

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

  const ambController = new AMBController(sourceChain!, destChain!, isAMBEnabled, logger, multiClient)
  const sygmaController = new SygmaController(sourceChain!, destChain!, isSygmaEnabled, logger, multiClient)
  const telepathyController = new TelepathyController(sourceChain!, destChain!, isTelepathyEnabled, logger, multiClient)

  const blocksListener = new BlocksListener(
    [ambController, sygmaController, telepathyController].filter((controller) => controller.isEnabled == true),
    timeFetchBlocksMs, // every 5 minutes
    logger,
    multiClient,
  )
  blocksListener.start()
}

main()
