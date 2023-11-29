import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { CelerAdapter } from "../../../types/contracts/adapters/Celer/CelerAdapter"
import type { CelerHeaderReporter } from "../../../types/contracts/adapters/Celer/CelerHeaderReporter"
import type { CelerMessageRelay } from "../../../types/contracts/adapters/Celer/CelerMessageRelay"
import type { CelerAdapter__factory } from "../../../types/factories/contracts/adapters/Celer/CelerAdapter__factory"
import type { CelerHeaderReporter__factory } from "../../../types/factories/contracts/adapters/Celer/CelerHeaderReporter__factory"
import type { CelerMessageRelay__factory } from "../../../types/factories/contracts/adapters/Celer/CelerMessageRelay__factory"
import { verify } from "../index"

task("deploy:adapter:CelerAdapter")
  .addParam("chainId", "chain id of the reporter contract")
  .addParam("reporter", "address of the reporter contract")
  .addParam("messageBus", "address of the Celer message bus contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying CelerAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const celerAdapterFactory: CelerAdapter__factory = <CelerAdapter__factory>(
      await hre.ethers.getContractFactory("CelerAdapter")
    )
    const constructorArguments = [
      taskArguments.chainId,
      taskArguments.reporter,
      taskArguments.messageBus,
      taskArguments.chainId,
    ] as const
    const celerAdapter: CelerAdapter = <CelerAdapter>(
      await celerAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await celerAdapter.deployed()
    console.log("CelerAdapter deployed to:", celerAdapter.address)
    if (taskArguments.verify) await verify(hre, celerAdapter, constructorArguments)
  })

task("deploy:adapter:CelerHeaderReporter")
  .addParam("chainId", "chain id of the adapter contract")
  .addParam("headerStorage", "address of the header storage contract")
  .addParam("messageBus", "address of the Celer message bus contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying CelerHeaderReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const celerHeaderReporterFactory: CelerHeaderReporter__factory = <CelerHeaderReporter__factory>(
      await hre.ethers.getContractFactory("CelerHeaderReporter")
    )
    const constructorArguments = [
      taskArguments.headerStorage,
      taskArguments.chainId,
      taskArguments.messageBus,
      taskArguments.chainId,
    ] as const
    const celerHeaderReporter: CelerHeaderReporter = <CelerHeaderReporter>(
      await celerHeaderReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await celerHeaderReporter.deployed()
    console.log("CelerHeaderReporter deployed to:", celerHeaderReporter.address)
    if (taskArguments.verify) await verify(hre, celerHeaderReporter, constructorArguments)
  })

task("deploy:adapter:CelerMessageRelay")
  .addParam("chainId", "chain id of the adapter contract")
  .addParam("yaho", "address of the Yaho contract")
  .addParam("messageBus", "address of the Celer message bus contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying CelerMessageRelay...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const celerMessageRelayFactory: CelerMessageRelay__factory = <CelerMessageRelay__factory>(
      await hre.ethers.getContractFactory("CelerMessageRelay")
    )
    const constructorArguments = [
      taskArguments.yaho,
      taskArguments.chainId,
      taskArguments.messageBus,
      taskArguments.chainId,
    ] as const
    const celerMessageRelay: CelerMessageRelay = <CelerMessageRelay>(
      await celerMessageRelayFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await celerMessageRelay.deployed()
    console.log("CelerMessageRelay deployed to:", celerMessageRelay.address)
    if (taskArguments.verify) await verify(hre, celerMessageRelay, constructorArguments)
  })
