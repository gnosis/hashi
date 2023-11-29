import "dotenv/config"
import { parseEther } from "viem"
import {
  arbitrum,
  avalanche,
  bsc,
  bscTestnet,
  gnosis,
  goerli,
  mainnet,
  optimism,
  optimismGoerli,
  polygon,
  sepolia,
} from "viem/chains"

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
    [sepolia.name]: process.env.SEPOLIA_RPC_URL as string,
  },
  contractAddresses: {
    adapterAddresses: {
      unidirectional: {
        [mainnet.name]: {
          [bsc.name]: {
            AxelarAdapter: process.env.BSC_AXELAR_ADAPTER_MAINNET as `0x${string}`,
            TelepathyAdapter: process.env.BSC_TELEPATHY_ADAPTER as `0x${string}`,
            HyperlaneAdapter: process.env.BSC_HYPERLANE_ADAPTER as `0x${string}`,
            LayerZeroAdapter: process.env.BSC_LAYER_ZERO_ADAPTER_MAINNET as `0x${string}`,
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
          [polygon.name]: {
            CelerAdapter: process.env.POLYGON_CELER_ADAPTER_MAINNET as `0x${string}`,
          },
          [avalanche.name]: {
            LayerZeroAdapter: process.env.AVALANCHE_LAYER_ZERO_ADAPTER_MAINNET as `0x${string}`,
            CCIPAdapter: process.env.AVALANCHE_CCIP_ADAPTER_MAINNET as `0x${string}`,
          },
          /*[goerli.name]: {
            AMBReporter: "0xedc0b1d3de4496e0d917af42f29cb71eb2982319" as `0x${string}`,
            SygmaReporter: "0x2f96d347c932ac73b56e9352ecc0707e25173d88" as `0x${string}`,
          },*/
        },
        [sepolia.name]: {
          [optimismGoerli.name]: {
            CCIPAdapter: process.env.OPTIMISM_GOERLI_CCIP_ADAPTER_SEPOLIA as `0x${string}`,
          },
          [bscTestnet.name]: {
            CCIPAdapter: process.env.BSC_TESTNET_CCIP_ADAPTER_SEPOLIA as `0x${string}`,
          },
        },
        [goerli.name]: {
          [bscTestnet.name]: {
            ZetaChainAdapter: process.env.BSC_TESTNET_ZETA_ADAPTER_GOERLI as `0x${string}`,
          },
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
            AxelarReporter: process.env.MAINNET_AXELAR_REPORTER_BSC as `0x${string}`,
            HyperlaneReporter: process.env.MAINNET_HYPERLANE_REPORTER_BSC as `0x${string}`,
            LayerZeroReporter: process.env.MAINNET_LAYER_ZERO_REPORTER_BSC as `0x${string}`,
          },
          [gnosis.name]: {
            AMBReporter: process.env.MAINNET_AMB_REPORTER as `0x${string}`,
            ConnextReporter: process.env.MAINNET_REPORTER_GNOSIS as `0x${string}`,
          },
          [optimism.name]: {
            L1CrossDomainMessengerHeaderReporter: process.env
              .MAINNET_L1_CROSS_DOMAIN_MESSENGER_HEADER_REPORTER_ADDRESS as `0x${string}`,
          },
          [polygon.name]: {
            CelerReporter: process.env.MAINNET_CELER_REPORTER_POLYGON as `0x${string}`,
          },
          [avalanche.name]: {
            LayerZeroReporter: process.env.MAINNET_LAYER_ZERO_REPORTER_AVALANCHE as `0x${string}`,
            CCIPReporter: process.env.MAINNET_CCIP_REPORTER_AVALANCHE as `0x${string}`,
          },
        },
        [sepolia.name]: {
          [optimismGoerli.name]: {
            CCIPReporter: process.env.SEPOLIA_CCIP_REPORTER_OPTIMISM_GOERLI as `0x${string}`,
          },
          [bscTestnet.name]: {
            CCIPReporter: process.env.SEPOLIA_CCIP_REPORTER_BSC_TESTNET as `0x${string}`,
          },
        },
        [goerli.name]: {
          [bscTestnet.name]: {
            ZetaChainReporter: process.env.GOERLI_ZETA_REPORTER_BSC_TESTNET as `0x${string}`,
          },
        },
      },
      [mainnet.name]: {
        WormholeHeaderReporter: process.env.MAINNET_WORMHOLE_HEADER_REPORTER as `0x${string}`,
      },
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
    AxelarReporterController: {
      reportHeadersValue: parseEther(process.env.AXELAR_REPORT_HEADERS_VALUE as string),
    },
    CCIPReporterController: {
      reportHeadersValue: parseEther(process.env.CCIP_REPORT_HEADERS_VALUE as string),
    },
    CelerReporterController: {
      reportHeadersValue: parseEther(process.env.CELER_REPORT_HEADERS_VALUE as string),
    },
    ConnextReporterController: {
      reportHeadersValue: parseEther(process.env.CONNEXT_REPORT_HEADERS_VALUE as string),
    },
    LayerZeroReporterController: {
      reportHeadersValue: parseEther(process.env.LAYER_ZERO_REPORT_HEADERS_VALUE as string),
    },
    SygmaReporterController: {
      domainIds: {
        [gnosis.name]: 101,
        [mainnet.name]: 1,
      },
      reportHeadersToDomainValue: parseEther(process.env.SYGMA_REPORT_HEADERS_TO_DOMAIN_MSG_VALUE as string),
    },
    TelepathyReporterController: {
      baseProofUrl: process.env.TELEPATHY_PROOF_API_URL as string,
    },
    WormholeReporterController: {
      wormholeChainIds: {
        [mainnet.name]: 2,
      },
      wormholeScanBaseUrl: process.env.WORMHOLE_SCAN_BASE_URL as string,
    },
    ZetaReporterController: {
      reportHeadersValue: parseEther(process.env.ZETA_CHAIN_REPORT_HEADERS_VALUE as string),
    },
  },
}
