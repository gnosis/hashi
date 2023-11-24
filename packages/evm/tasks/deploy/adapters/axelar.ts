import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { AxelarAdapter } from "../../../types/contracts/adapters/Axelar/AxelarAdapter"
import type { AxelarHeaderReporter } from "../../../types/contracts/adapters/Axelar/AxelarHeaderReporter"
import type { AxelarMessageRelay } from "../../../types/contracts/adapters/Axelar/AxelarMessageRelay"
import type { AxelarAdapter__factory } from "../../../types/factories/contracts/adapters/Axelar/AxelarAdapter__factory"
import type { AxelarHeaderReporter__factory } from "../../../types/factories/contracts/adapters/Axelar/AxelarHeaderReporter__factory"
import type { AxelarMessageRelay__factory } from "../../../types/factories/contracts/adapters/Axelar/AxelarMessageRelay__factory"
import { verify } from "../index"

task("deploy:adapter:AxelarAdapter")
  .addParam("chainId", "chain id of the reporter contract")
  .addParam("chainName", "chain name (according to https://docs.axelar.dev/dev/reference/mainnet-chain-names)")
  .addParam("reporter", "address of the reporter contract")
  .addParam("axlrGateway", "address of the Axelar gateway contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying AxelarAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const axelarAdapterFactory: AxelarAdapter__factory = <AxelarAdapter__factory>(
      await hre.ethers.getContractFactory("AxelarAdapter")
    )
    const constructorArguments = [
      taskArguments.chainId,
      taskArguments.reporter,
      taskArguments.axlrGateway,
      taskArguments.chainName,
      taskArguments.reporter,
    ] as const
    const axelarAdapter: AxelarAdapter = <AxelarAdapter>(
      await axelarAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await axelarAdapter.deployed()
    console.log("AxelarAdapter deployed to:", axelarAdapter.address)
    if (taskArguments.verify) await verify(hre, axelarAdapter)
  })

task("deploy:adapter:AxelarHeaderReporter")
  .addParam("chainId", "chain id of the adapter contract")
  .addParam("chainName", "chain name (according to https://docs.axelar.dev/dev/reference/mainnet-chain-names)")
  .addParam("headerStorage", "address of the header storage contract")
  .addParam("axlrGateway", "address of the Axelar gateway contract")
  .addParam("axlrGasService", "address of the Axelar gas service contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying AxelarHeaderReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const axelarHeaderReporterFactory: AxelarHeaderReporter__factory = <AxelarHeaderReporter__factory>(
      await hre.ethers.getContractFactory("AxelarHeaderReporter")
    )
    const constructorArguments = [
      taskArguments.headerStorage,
      taskArguments.chainId,
      taskArguments.axlrGateway,
      taskArguments.axlrGasService,
      taskArguments.chainName,
    ] as const
    const axelarHeaderReporter: AxelarHeaderReporter = <AxelarHeaderReporter>(
      await axelarHeaderReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await axelarHeaderReporter.deployed()
    console.log("AxelarHeaderReporter deployed to:", axelarHeaderReporter.address)
    if (taskArguments.verify) await verify(hre, axelarHeaderReporter)
  })

task("deploy:adapter:AxelarMessageRelay")
  .addParam("chainId", "chain id of the adapter contract")
  .addParam("chainName", "chain name (according to https://docs.axelar.dev/dev/reference/mainnet-chain-names)")
  .addParam("yaho", "address of the Yaho contract")
  .addParam("axlrGateway", "address of the Axelar gateway contract")
  .addParam("axlrGasService", "address of the Axelar gas service contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying AxelarMessageRelay...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const axelarMessageRelayFactory: AxelarMessageRelay__factory = <AxelarMessageRelay__factory>(
      await hre.ethers.getContractFactory("AxelarMessageRelay")
    )
    const constructorArguments = [
      taskArguments.yaho,
      taskArguments.chainId,
      taskArguments.axlrGateway,
      taskArguments.axlrGasService,
      taskArguments.chainName,
    ] as const
    const axelarMessageRelay: AxelarMessageRelay = <AxelarMessageRelay>(
      await axelarMessageRelayFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await axelarMessageRelay.deployed()
    console.log("AxelarMessageRelay deployed to:", axelarMessageRelay.address)
    if (taskArguments.verify) await verify(hre, axelarMessageRelay)
  })
