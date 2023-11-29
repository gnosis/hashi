import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task, types } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import { verify } from "."
import type { SygmaAdapter } from "../../types/contracts/adapters/Sygma/SygmaAdapter"
import type { SygmaHeaderReporter } from "../../types/contracts/adapters/Sygma/SygmaHeaderReporter"
import type { SygmaMessageRelay } from "../../types/contracts/adapters/Sygma/SygmaMessageRelay"
import type { SygmaAdapter__factory } from "../../types/factories/contracts/adapters/Sygma/SygmaAdapter__factory"
import type { SygmaHeaderReporter__factory } from "../../types/factories/contracts/adapters/Sygma/SygmaHeaderReporter__factory"
import type { SygmaMessageRelay__factory } from "../../types/factories/contracts/adapters/Sygma/SygmaMessageRelay__factory"

// Deploy source chain
task("deploy:Sygma:MessageRelay")
  .addParam("bridge", "address of the Sygma contract", undefined, types.string)
  .addParam("yaho", "address of the yaho contract", undefined, types.string)
  .addParam("resourceId", "sygma resource id", undefined, types.string)
  .addParam("defaultDestinationDomainId", "sygma default destination domain id", undefined, types.string)
  .addParam("defaultSygmaAdapter", "adapter", undefined, types.string)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying SygmaMessageRelay...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const sygmaMessageRelayFactory: SygmaMessageRelay__factory = <SygmaMessageRelay__factory>(
      await hre.ethers.getContractFactory("SygmaMessageRelay")
    )
    const constructorArguments = [
      taskArguments.bridge,
      taskArguments.yaho,
      taskArguments.resourceId,
      taskArguments.defaultDestinationDomainId,
      taskArguments.defaultSygmaAdapter,
    ] as const
    const sygmaMessageRelay: SygmaMessageRelay = <SygmaMessageRelay>(
      await sygmaMessageRelayFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await sygmaMessageRelay.deployed()
    console.log("SygmaMessageRelay deployed to:", sygmaMessageRelay.address)
    if (taskArguments.verify) await verify(hre, sygmaMessageRelay, constructorArguments)
  })

// Deploy source chain
task("deploy:Sygma:HeaderReporter")
  .addParam("bridge", "address of the Sygma contract", undefined, types.string)
  .addParam("headerStorage", "address of the HeaderStorage contract", undefined, types.string)
  .addParam("resourceId", "sygma resource id", undefined, types.string)
  .addParam("defaultDestinationDomainId", "sygma default destination domain id", undefined, types.string)
  .addParam("defaultSygmaAdapter", "adapter", undefined, types.string)
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
      taskArguments.defaultDestinationDomainId,
      taskArguments.defaultSygmaAdapter,
    ] as const
    const sygmaHeaderReporter: SygmaHeaderReporter = <SygmaHeaderReporter>(
      await sygmaHeaderReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await sygmaHeaderReporter.deployed()
    console.log("SygmaHeaderReporter deployed to:", sygmaHeaderReporter.address)
    if (taskArguments.verify) await verify(hre, sygmaHeaderReporter, constructorArguments)
  })

// Deploy on destination chain
task("deploy:Sygma:Adapter")
  .addParam("handler", "address of the Sygma handler contract", undefined, types.string)
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
