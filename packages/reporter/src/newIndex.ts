// import logger from "winston"
import { createPublicClient, http, createWalletClient, PublicClient, Chain } from "viem"
import AMBController from "./controller/AMBController"
import SygmaController from "./controller/SygmaController"
import TelepathyController from "./controller/TelepathyController"
import BlocksListener from "./BlockListener"
import "dotenv/config"
import winston from "winston"
function main() {
  const logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
  })
  const sourceChain = process.env.SOURCE_CHAIN
  const destChain = process.env.DEST_CHAIN
  const ambController = new AMBController(sourceChain!, destChain!, process.env.AMB_CONTROLLER === "true", logger)
  const sygmaController = new SygmaController(sourceChain!, destChain!, process.env.SYGMA_CONTROLLER === "true", logger)
  const telepathyController = new TelepathyController(
    sourceChain!,
    destChain!,
    process.env.TELEPATHY_CONTROLLER === "true",
    logger,
  )

  const blocksListener = new BlocksListener(
    [ambController, sygmaController, telepathyController].filter((controller) => controller.isEnabled == true),
    10 * 1000,
    logger,
  )
  blocksListener.start()
}

main()
