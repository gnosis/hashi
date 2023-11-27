import "dotenv/config"
import { gnosis, mainnet, goerli, polygon, optimism, bsc, arbitrum, avalanche } from "viem/chains"

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
    adapterAddresses: {
      unidirectional: {
        [mainnet.name]: {
          [bsc.name]: {
            AxelarAdapter: process.env.BSC_AXELAR_ADAPTER_MAINNET as `0x${string}`,
            TelepathyAdapter: process.env.BSC_TELEPATHY_ADAPTER as `0x${string}`,
          },
          [gnosis.name]: {
            TelepathyAdapter: process.env.GNOSIS_TELEPATHY_ADAPTER as `0x${string}`,
            AMBAdapter: process.env.GNOSIS_AMB_ADAPTER as `0x${string}`,
            ConnextAdapter: process.env.GNOSIS_CONNEXT_ADAPTER_MAINNET as `0x${string}`,
            // SygmaAdapter: process.env.GNOSIS_SYGMA_ADAPTER as `0x${string}`,
          },
          [polygon.name]: {
            TelepathyAdapter: process.env.POLYGON_TELEPATHY_ADAPTER as `0x${string}`,
          },
          [optimism.name]: {
            TelepathyAdapter: process.env.OPTIMISM_TELEPATHY_ADAPTER as `0x${string}`,
            L2CrossDomainMessengerAdapter: process.env
              .OPTIMISM_L2_CROSS_DOMAIN_MESSENGER_ADAPTER_ADDRESS as `0x${string}`,
          },
          [arbitrum.name]: {
            TelepathyAdapter: process.env.ARBITRUM_TELEPATHY_ADAPTER as `0x${string}`,
          },
          /*[goerli.name]: {
            AMBReporter: "0xedc0b1d3de4496e0d917af42f29cb71eb2982319" as `0x${string}`,
            SygmaReporter: "0x2f96d347c932ac73b56e9352ecc0707e25173d88" as `0x${string}`,
          },*/
        },
      },
      [gnosis.name]: {
        WormholeAdapter: process.env.GNOSIS_WORMHOLE_ADAPTER as `0x${string}`,
      },
      [polygon.name]: {
        WormholeAdapter: process.env.POLYGON_WORMHOLE_ADAPTER as `0x${string}`,
      },
      [bsc.name]: {
        WormholeAdapter: process.env.BSC_WORMHOLE_ADAPTER as `0x${string}`,
      },
      [optimism.name]: {
        WormholeAdapter: process.env.OPTIMISM_WORMHOLE_ADAPTER as `0x${string}`,
      },
      [avalanche.name]: {
        WormholeAdapter: process.env.AVALANCHE_WORMHOLE_ADAPTER as `0x${string}`,
      },
    },
    reporterAddresses: {
      unidirectional: {
        [mainnet.name]: {
          [bsc.name]: {
            AxelarReporter: process.env.MAINNET_AXELAR_HEADER_REPORTER_BSC as `0x${string}`,
          },
          [gnosis.name]: {
            AMBReporter: process.env.MAINNET_AMB_REPORTER as `0x${string}`,
            ConnextReporter: process.env.MAINNET_REPORTER_GNOSIS as `0x${string}`,
          },
          [optimism.name]: {
            L1CrossDomainMessengerHeaderReporter: process.env
              .MAINNET_L1_CROSS_DOMAIN_MESSENGER_HEADER_REPORTER_ADDRESS as `0x${string}`,
          },
        },
      },

      [mainnet.name]: {
        WormholeHeaderReporter: process.env.MAINNET_WORMHOLE_HEADER_REPORTER as `0x${string}`,
      }
    },
    [mainnet.name]: {
      Wormhole: process.env.MAINNET_WORMHOLE_ADDRESS as `0x${string}`,
    },
    [gnosis.name]: {
      TelepathyLightClientMainnet: "0x34b5378DE786389a477b40dD710812c250185f83" as `0x${string}`,
    },
    [polygon.name]: {
      TelepathyLightClientMainnet: "0x34b5378DE786389a477b40dD710812c250185f83" as `0x${string}`,
    },
    [bsc.name]: {
      TelepathyLightClientMainnet: "0x34b5378DE786389a477b40dD710812c250185f83" as `0x${string}`,
    },
    [optimism.name]: {
      TelepathyLightClientMainnet: "0x34b5378DE786389a477b40dD710812c250185f83" as `0x${string}`,
    },
    [arbitrum.name]: {
      TelepathyLightClientMainnet: "0x34b5378DE786389a477b40dD710812c250185f83" as `0x${string}`,
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
    WormholeReporterController: {
      wormholeScanBaseUrl: process.env.WORMHOLE_SCAN_BASE_URL as string,
      wormholeChainIds: {
        [mainnet.name]: 2,
      },
    },
  },
}
