import "dotenv/config"
import { gnosis, mainnet, goerli, polygon, optimism, bsc, arbitrum } from "viem/chains"

export const settings = {
  Coordinator: {
    blockBuffer: Number(process.env.BLOCK_BUFFER),
    queryBlockLength: Number(process.env.QUERY_BLOCK_LENGTH),
    intervalFetchBlocksMs: Number(process.env.TIME_FETCH_BLOCKS_MS),
    intervalsUpdateLightClients: {
      TelepathyReporterController: Number(process.env.TELEPATHY_INTERVAL_FETCH_HEAD_UPDATES),
    },
  },
  rpcUrls: {
    [gnosis.name]: process.env.GNOSIS_RPC_URL as string,
    [goerli.name]: process.env.GOERLI_RPC_URL as string,
    [mainnet.name]: process.env.MAINNET_RPC_URL as string,
    [polygon.name]: process.env.POLYGON_RPC_URL as string,
    [optimism.name]: process.env.OPTIMISM_RPC_URL as string,
    [bsc.name]: process.env.BSC_RPC_URL as string,
    [arbitrum.name]: process.env.ARBITRUM_RPC_URL as string,
  },
  contractAddresses: {
    [mainnet.name]: {
      AMBReporter: process.env.MAINNET_AMB_REPORTER as `0x${string}`,
      AxelarReporter: process.env.MAINNET_HEADER_REPORTER as `0x${string}`,
    },
    [gnosis.name]: {
      AMBAdapter: process.env.GNOSIS_AMB_ADAPTER as `0x${string}`,
      SygmaAdapter: process.env.GNOSIS_SYGMA_ADAPTER as `0x${string}`,
      TelepathyAdapter: process.env.GNOSIS_TELEPATHY_ADAPTER as `0x${string}`,
      TelepathyLightClient: "0x34b5378DE786389a477b40dD710812c250185f83" as `0x${string}`,
    },
    [goerli.name]: {
      AMBReporter: "0xedc0b1d3de4496e0d917af42f29cb71eb2982319" as `0x${string}`,
      SygmaReporter: "0x2f96d347c932ac73b56e9352ecc0707e25173d88" as `0x${string}`,
    },
    [polygon.name]: {
      TelepathyAdapter: process.env.POLYGON_TELEPATHY_ADAPTER as `0x${string}`,
      TelepathyLightClient: "0x34b5378DE786389a477b40dD710812c250185f83" as `0x${string}`,
      AxelarAdapter: process.env.POLYGON_AXELAR_ADAPTER as `0x${string}`,
    },
    [bsc.name]: {
      TelepathyAdapter: process.env.BSC_TELEPATHY_ADAPTER as `0x${string}`,
      TelepathyLightClient: "0x34b5378DE786389a477b40dD710812c250185f83" as `0x${string}`,
      AxelarAdapter: process.env.BSC_AXELAR_ADAPTER as `0x${string}`,
    },
    [optimism.name]: {
      TelepathyAdapter: process.env.OPTIMISM_TELEPATHY_ADAPTER as `0x${string}`,
      TelepathyLightClient: "0x34b5378DE786389a477b40dD710812c250185f83" as `0x${string}`,
      AxelarAdapter: process.env.OPTIMISM_AXELAR_ADAPTER as `0x${string}`,
    },
    [arbitrum.name]: {
      TelepathyAdapter: process.env.ARBITRUM_TELEPATHY_ADAPTER as `0x${string}`,
      TelepathyLightClient: "0x34b5378DE786389a477b40dD710812c250185f83" as `0x${string}`,
      AxelarAdapter: process.env.ARBITRUM_AXELAR_ADAPTER as `0x${string}`,
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
    },
  },
}
