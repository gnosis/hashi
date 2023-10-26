import "dotenv/config"
import { gnosis, mainnet, goerli } from "viem/chains"

export const settings = {
  BlockListener: {
    blockBuffer: Number(process.env.BLOCK_BUFFER),
    queryBlockLength: Number(process.env.QUERY_BLOCK_LENGTH),
    intervalFetchBlocksMs: Number(process.env.TIME_FETCH_BLOCKS_MS),
  },
  rpcUrls: {
    [gnosis.name]: process.env.GNOSIS_RPC_URL as string,
    [goerli.name]: process.env.GOERLI_RPC_URL as string,
  },
  contractAddresses: {
    [gnosis.name]: {
      AMBAdapter: "0x01268DB05965CeAc2a89566c42CD550ED7eE5ECD" as `0x${string}`,
      SygmaAdapter: "0x9AD7a6f4FDA8247cC0bF5932B68c5b619937dB15" as `0x${string}`,
      TelapathyAdapter: "0x2f1E51a2763FB67fe09971Fd8d849716137A3357" as `0x${string}`,
      TelepathyLightClient: "0x34b5378DE786389a477b40dD710812c250185f83" as `0x${string}`,
    },
    [goerli.name]: {
      AMBReporter: "0xedc0b1d3de4496e0d917af42f29cb71eb2982319" as `0x${string}`,
      SygmaReporter: "0x2f96d347c932ac73b56e9352ecc0707e25173d88" as `0x${string}`,
    },
  },
  reporterControllers: {
    AMBReporterController: {
      reportHeadersGas: Number(process.env.AMB_REPORTER_HEADERS_GAS),
    },
    SygmaReporterController: {
      reportHeadersToDomainMsgValue: process.env.SYGMA_REPORT_HEADERS_TO_DOMAIN_MSG_VALUE as string,
      domainIds: {
        [gnosis.name]: 101,
        [mainnet.name]: 1,
      },
    },
    TelepathyReporterController: {
      baseProofUrl: process.env.TELEPATHY_PROOF_API_URL as string,
      blockBuffer: Number(process.env.TELEPATHY_BLOCK_BUFFER),
      intervalFetchBlocksMs: Number(process.env.TELEPATHY_TIME_FETCH_BLOCK_MS),
    },
  },
}
