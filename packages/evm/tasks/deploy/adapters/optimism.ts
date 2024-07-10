import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task, types } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import { verify } from ".."
import type { L1CrossDomainMessengerHeaderReporter } from "../../../types/contracts/adapters/Optimism/L1CrossDomainMessengerHeaderReporter"
import type { L1CrossDomainMessengerMessageRelay } from "../../../types/contracts/adapters/Optimism/L1CrossDomainMessengerMessageRelay"
import type { L2CrossDomainMessengerAdapter } from "../../../types/contracts/adapters/Optimism/L2CrossDomainMessengerAdapter"
import { L1CrossDomainMessengerHeaderReporter__factory } from "../../../types/factories/contracts/adapters/Optimism/L1CrossDomainMessengerHeaderReporter__factory"
import { L1CrossDomainMessengerMessageRelay__factory } from "../../../types/factories/contracts/adapters/Optimism/L1CrossDomainMessengerMessageRelay__factory"
import { L2CrossDomainMessengerAdapter__factory } from "../../../types/factories/contracts/adapters/Optimism/L2CrossDomainMessengerAdapter__factory"

// Deploy on destination chain
task("deploy:Optimism:Adapter")
  .addParam("l2CrossDomainMessenger", "address of the L2CrossDomainMessenger contract", undefined, types.string)
  .addParam("reporter", "address of the hash reporter", undefined, types.string)
  .addParam("chainId", "chainId of the source chain", undefined, types.int)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying L2CrossDomainMessengerAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const l2CrossDomainMessengerAdapterFactory: L2CrossDomainMessengerAdapter__factory = <
      L2CrossDomainMessengerAdapter__factory
    >await hre.ethers.getContractFactory("L2CrossDomainMessengerAdapter")
    const constructorArguments = [
      taskArguments.l2CrossDomainMessenger,
      taskArguments.reporter,
      taskArguments.chainId,
    ] as const
    const l2CrossDomainMessengerAdapter: L2CrossDomainMessengerAdapter = <L2CrossDomainMessengerAdapter>(
      await l2CrossDomainMessengerAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await l2CrossDomainMessengerAdapter.deployed()
    console.log("L2CrossDomainMessengerAdapter deployed to:", l2CrossDomainMessengerAdapter.address)
    if (taskArguments.verify) await verify(hre, l2CrossDomainMessengerAdapter, constructorArguments)
  })

// Deploy source chain
task("deploy:Optimism:HeaderReporter")
  .addParam("l1CrossDomainMessenger", "address of the L1CrossDomainMessenger contract", undefined, types.string)
  .addParam("headerStorage", "address of the header storage contract", undefined, types.string)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying L1CrossDomainMessengerHeaderReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const l1CrossDomainMessengerHeaderReporterFactory: L1CrossDomainMessengerHeaderReporter__factory = <
      L1CrossDomainMessengerHeaderReporter__factory
    >await hre.ethers.getContractFactory("L1CrossDomainMessengerHeaderReporter")
    const constructorArguments = [taskArguments.l1CrossDomainMessenger, taskArguments.headerStorage] as const
    const l1CrossDomainMessengerHeaderReporter: L1CrossDomainMessengerHeaderReporter = <
      L1CrossDomainMessengerHeaderReporter
    >await l1CrossDomainMessengerHeaderReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    await l1CrossDomainMessengerHeaderReporter.deployed()
    console.log("L1CrossDomainMessengerHeaderReporter deployed to:", l1CrossDomainMessengerHeaderReporter.address)
    if (taskArguments.verify) await verify(hre, l1CrossDomainMessengerHeaderReporter, constructorArguments)
  })

// Deploy source chain
task("deploy:Optimism:MessageRelay")
  .addParam("l1CrossDomainMessenger", "address of the L1CrossDomainMessenger contract", undefined, types.string)
  .addParam("yaho", "address of the Yaho contract", undefined, types.string)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying L1CrossDomainMessengerMessageRelay...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const l1CrossDomainMessengerMessageRelayFactory: L1CrossDomainMessengerMessageRelay__factory = <
      L1CrossDomainMessengerMessageRelay__factory
    >await hre.ethers.getContractFactory("L1CrossDomainMessengerMessageRelay")
    const constructorArguments = [taskArguments.l1CrossDomainMessenger, taskArguments.yaho] as const
    const l1CrossDomainMessengerMessageRelay: L1CrossDomainMessengerMessageRelay = <L1CrossDomainMessengerMessageRelay>(
      await l1CrossDomainMessengerMessageRelayFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await l1CrossDomainMessengerMessageRelay.deployed()
    console.log("L1CrossDomainMessengerMessageRelay deployed to:", l1CrossDomainMessengerMessageRelay.address)
    if (taskArguments.verify) await verify(hre, l1CrossDomainMessengerMessageRelay, constructorArguments)
  })
