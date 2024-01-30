import "@nomicfoundation/hardhat-chai-matchers"
import "@nomicfoundation/hardhat-toolbox"
import { config as dotenvConfig } from "dotenv"
import "hardhat-change-network"
import type { HardhatUserConfig } from "hardhat/config"
import type { NetworkUserConfig } from "hardhat/types"
import { resolve } from "path"

import "./tasks/accounts"
import "./tasks/deploy"

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env"
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) })

// Ensure that we have all the environment variables we need.
const mnemonic: string | undefined = process.env.MNEMONIC
if (!mnemonic) {
  throw new Error("Please set your MNEMONIC in a .env file")
}

const infuraApiKey: string | undefined = process.env.INFURA_API_KEY
if (!infuraApiKey) {
  throw new Error("Please set your INFURA_API_KEY in a .env file")
}

const chainIds = {
  "arbitrum-mainnet": 42161,
  avalanche: 43114,
  bsc: 56,
  gnosis: 100,
  chiado: 10200,
  goerli: 5,
  hardhat: 31337,
  mainnet: 1,
  "optimism-mainnet": 10,
  "polygon-mainnet": 137,
  "polygon-mumbai": 80001,
  sepolia: 11155111,
}

function getChainConfig(chain: keyof typeof chainIds): NetworkUserConfig {
  let jsonRpcUrl: string = process.env[`${chain.toUpperCase()}_JSON_RPC_URL`] as string
  if (!jsonRpcUrl) {
    switch (chain) {
      case "mainnet":
        jsonRpcUrl = "https://ethereum.publicnode.com"
        break
      case "avalanche":
        jsonRpcUrl = "https://api.avax.network/ext/bc/C/rpc"
        break
      case "bsc":
        jsonRpcUrl = "https://bsc-dataseed1.binance.org"
        break
      case "gnosis":
        jsonRpcUrl = "https://rpc.gnosis.gateway.fm"
        break
      case "chiado":
        jsonRpcUrl = "https://rpc.chiadochain.net/"
        break
      default:
        jsonRpcUrl = `https://${chain}.infura.io/v3/${infuraApiKey}`
    }
  }

  return {
    accounts: {
      count: 10,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    chainId: chainIds[chain],
    url: jsonRpcUrl,
  }
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  etherscan: {
    apiKey: {
      arbitrumOne: process.env.ARBISCAN_API_KEY || "",
      avalanche: process.env.SNOWTRACE_API_KEY || "",
      bsc: process.env.BSCSCAN_API_KEY || "",
      gnosis: process.env.GNOSISSCAN_API_KEY || "",
      goerli: process.env.ETHERSCAN_API_KEY || "",
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      optimisticEthereum: process.env.OPTIMISM_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
    },
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
    src: "./contracts",
  },
  networks: {
    hardhat: {},
    arbitrum: getChainConfig("arbitrum-mainnet"),
    avalanche: getChainConfig("avalanche"),
    bsc: getChainConfig("bsc"),
    gnosis: getChainConfig("gnosis"),
    chiado: getChainConfig("chiado"),
    mainnet: getChainConfig("mainnet"),
    optimism: getChainConfig("optimism-mainnet"),
    "polygon-mainnet": getChainConfig("polygon-mainnet"),
    "polygon-mumbai": getChainConfig("polygon-mumbai"),
    sepolia: getChainConfig("sepolia"),
    goerli: getChainConfig("goerli"),
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.20",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 10000,
      },
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
  },
}

export default config
