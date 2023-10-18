import "dotenv/config"
import AMB from "./reporter/AMBReporter"
import Sygma from "./reporter/SygmaReporter"
import Telepathy from "./reporter/TelepathyReporter"

function main() {
  if (process.env.AMB_REPORTER === "true") {
    const amb = new AMB()
    amb.callReportHeader({
      frequency_config: process.env.AMB_FREQUENCY!,
      source_chain: process.env.AMB_SOURCE_CHAIN!,
      destination_chain: process.env.AMB_DEST_CHAIN!,
    })
  }
  if (process.env.SYGMA_REPORTER === "true") {
    const sygma = new Sygma()
    sygma.callReportHeader({
      frequency_config: process.env.SYGMA_FREQUENCY!,
      source_chain: process.env.SYGMA_SOURCE_CHAIN!,
      destination_chain: process.env.SYGMA_DEST_CHAIN!,
    })
  }
  if (process.env.TELEPATHY_REPORTER === "true") {
    const telepathy = new Telepathy()
    telepathy.callReportHeader({
      frequency_config: process.env.TELEPATHY_FREQUENCY!,
      source_chain: process.env.TELEPATHY_SOURCE_CHAIN!,
      destination_chain: process.env.TELEPATHY_DEST_CHAIN!,
    })
  }
}

main()
