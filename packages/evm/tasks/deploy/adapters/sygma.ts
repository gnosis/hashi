import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { SygmaAdapter } from "../../../types/contracts/adapters/Sygma/SygmaAdapter"
import type { SygmaHeaderReporter } from "../../../types/contracts/adapters/Sygma/SygmaHeaderReporter"
import type { SygmaMessageRelayer } from "../../../types/contracts/adapters/Sygma/SygmaMessageRelayer"
import type { SygmaAdapter__factory } from "../../../types/factories/contracts/adapters/Sygma/SygmaAdapter__factory"
import type { SygmaHeaderReporter__factory } from "../../../types/factories/contracts/adapters/Sygma/SygmaHeaderReporter__factory"
import type { SygmaMessageRelayer__factory } from "../../../types/factories/contracts/adapters/Sygma/SygmaMessageRelayer__factory"
import { verify } from "../index"

task("deploy:adapter:SygmaAdapter")
  .addParam("handler", "address of the generic handler contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying SygmaAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const sygmaAdapterFactory: SygmaAdapter__factory = <SygmaAdapter__factory>(
      await hre.ethers.getContractFactory("SygmaAdapter")
    )
    const constructorArguments = [taskArguments.handler] as const
    const sygmaAdapter: SygmaAdapter = <SygmaAdapter>(
      await sygmaAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await sygmaAdapter.deployed()
    console.log("SygmaAdapter deployed to:", sygmaAdapter.address)
    if (taskArguments.verify) await verify(hre, sygmaAdapter, constructorArguments)
  })

task("deploy:adapter:SygmaHeaderReporter")
  .addParam("chainId", "chain id of the adapter contract")
  .addParam("bridge", "address of the bridge contract")
  .addParam("headerStorage", "address of the header storage contract")
  .addParam("resourceId", "address of the Sygma router contract")
  .addParam("sygmaAdapter", "address of the Sygma adapter contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying SygmaHeaderReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const sygmaHeaderReporterFactory: SygmaHeaderReporter__factory = <SygmaHeaderReporter__factory>(
      await hre.ethers.getContractFactory("SygmaHeaderReporter")
    )
    const constructorArguments = [
      taskArguments.bridge,
      taskArguments.headerStorage,
      taskArguments.resourceId,
      taskArguments.chainId,
      taskArguments.sygmaAdapter,
    ] as const
    const sygmaHeaderReporter: SygmaHeaderReporter = <SygmaHeaderReporter>(
      await sygmaHeaderReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await sygmaHeaderReporter.deployed()
    console.log("SygmaHeaderReporter deployed to:", sygmaHeaderReporter.address)
    if (taskArguments.verify) await verify(hre, sygmaHeaderReporter, constructorArguments)
  })

task("deploy:adapter:SygmaMessageRelayer")
  .addParam("chainId", "chain id of the adapter contract")
  .addParam("bridge", "address of the bridge contract")
  .addParam("yaho", "address of the Yaho contract")
  .addParam("resourceId", "address of the Sygma router contract")
  .addParam("sygmaAdapter", "address of the Sygma adapter contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying SygmaMessageRelayer...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const sygmaMessageRelayerFactory: SygmaMessageRelayer__factory = <SygmaMessageRelayer__factory>(
      await hre.ethers.getContractFactory("SygmaMessageRelayer")
    )
    const constructorArguments = [
      taskArguments.bridge,
      taskArguments.yaho,
      taskArguments.resourceId,
      taskArguments.chainId,
      taskArguments.sygmaAdapter,
    ] as const
    const sygmaMessageRelayer: SygmaMessageRelayer = <SygmaMessageRelayer>(
      await sygmaMessageRelayerFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await sygmaMessageRelayer.deployed()
    console.log("SygmaMessageRelayer deployed to:", sygmaMessageRelayer.address)
    if (taskArguments.verify) await verify(hre, sygmaMessageRelayer, constructorArguments)
  })
