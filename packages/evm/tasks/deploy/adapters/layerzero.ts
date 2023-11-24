import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { LayerZeroAdapter } from "../../../types/contracts/adapters/LayerZero/LayerZeroAdapter"
import type { LayerZeroHeaderReporter } from "../../../types/contracts/adapters/LayerZero/LayerZeroHeaderReporter"
import type { LayerZeroMessageRelay } from "../../../types/contracts/adapters/LayerZero/LayerZeroMessageRelay"
import type { LayerZeroAdapter__factory } from "../../../types/factories/contracts/adapters/LayerZero/LayerZeroAdapter__factory"
import type { LayerZeroHeaderReporter__factory } from "../../../types/factories/contracts/adapters/LayerZero/LayerZeroHeaderReporter__factory"
import type { LayerZeroMessageRelay__factory } from "../../../types/factories/contracts/adapters/LayerZero/LayerZeroMessageRelay__factory"
import { verify } from "../index"

task("deploy:adapter:LayerZeroAdapter")
  .addParam("chainId", "chain id of the reporter contract")
  .addParam("lzChainId", "layerzero chain id (according to https://layerzero.gitbook.io/docs/technical-reference/mainnet/supported-chain-ids)")
  .addParam("reporter", "address of the reporter contract")
  .addParam("lzEndpoint", "address of the LayerZero endpoint contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying LayerZeroAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const layerZeroAdapterFactory: LayerZeroAdapter__factory = <LayerZeroAdapter__factory>(
      await hre.ethers.getContractFactory("LayerZeroAdapter")
    )
    const constructorArguments = [
      taskArguments.chainId,
      taskArguments.reporter,
      taskArguments.lzEndpoint,
      taskArguments.lzChainId,
    ] as const
    const layerZeroAdapter: LayerZeroAdapter = <LayerZeroAdapter>(
      await layerZeroAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await layerZeroAdapter.deployed()
    console.log("LayerZeroAdapter deployed to:", layerZeroAdapter.address)
    if (taskArguments.verify) await verify(hre, layerZeroAdapter, constructorArguments)
  })

task("deploy:adapter:LayerZeroHeaderReporter")
  .addParam("chainId", "chain id of the adapter contract")
  .addParam("lzChainId", "layerzero chain id (according to https://layerzero.gitbook.io/docs/technical-reference/mainnet/supported-chain-ids)")
  .addParam("headerStorage", "address of the header storage contract")
  .addParam("lzEndpoint", "address of the LayerZero endpoint contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying LayerZeroHeaderReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const layerZeroHeaderReporterFactory: LayerZeroHeaderReporter__factory = <LayerZeroHeaderReporter__factory>(
      await hre.ethers.getContractFactory("LayerZeroHeaderReporter")
    )
    const constructorArguments = [
      taskArguments.headerStorage,
      taskArguments.chainId,
      taskArguments.lzEndpoint,
      taskArguments.lzChainId,
    ] as const
    const layerZeroHeaderReporter: LayerZeroHeaderReporter = <LayerZeroHeaderReporter>(
      await layerZeroHeaderReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await layerZeroHeaderReporter.deployed()
    console.log("LayerZeroHeaderReporter deployed to:", layerZeroHeaderReporter.address)
    if (taskArguments.verify) await verify(hre, layerZeroHeaderReporter, constructorArguments)
  })

task("deploy:adapter:LayerZeroMessageRelay")
  .addParam("chainId", "chain id of the adapter contract")
  .addParam("lzChainId", "layerzero chain id (according to https://layerzero.gitbook.io/docs/technical-reference/mainnet/supported-chain-ids)")
  .addParam("yaho", "address of the Yaho contract")
  .addParam("lzEndpoint", "address of the LayerZero endpoint contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying LayerZeroMessageRelay...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const layerZeroMessageRelayFactory: LayerZeroMessageRelay__factory = <LayerZeroMessageRelay__factory>(
      await hre.ethers.getContractFactory("LayerZeroMessageRelay")
    )
    const constructorArguments = [
      taskArguments.yaho,
      taskArguments.chainId,
      taskArguments.lzEndpoint,
      taskArguments.lzChainId,
    ] as const
    const layerZeroMessageRelay: LayerZeroMessageRelay = <LayerZeroMessageRelay>(
      await layerZeroMessageRelayFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await layerZeroMessageRelay.deployed()
    console.log("LayerZeroMessageRelay deployed to:", layerZeroMessageRelay.address)
    if (taskArguments.verify) await verify(hre, layerZeroMessageRelay, constructorArguments)
  })
