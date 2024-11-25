import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task, types } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import { verify } from ".."
import type { VeaAdapter } from "../../../types/contracts/adapters/Vea/VeaAdapter"
import type { VeaReporter } from "../../../types/contracts/adapters/Vea/VeaReporter"
import type { VeaAdapter__factory } from "../../../types/factories/contracts/adapters/Vea/VeaAdapter__factory"
import { VeaReporter__factory } from "../../../types/factories/contracts/adapters/Vea/VeaReporter__factory"

// Deploy on destination chain
task("deploy:Vea:Adapter")
  .addParam("veaOutbox", "address of the Vea Outbox contract", undefined, types.string)
  .addParam("reporter", "address of the hash reporter", undefined, types.string)
  .addParam("sourceChainId", "sourceChainId of the source chain", undefined, types.int)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying VeaAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const veaAdapterFactory: VeaAdapter__factory = <VeaAdapter__factory>(
      await hre.ethers.getContractFactory("VeaAdapter")
    )

    const constructorArguments = [
      taskArguments.veaOutbox,
      taskArguments.reporter,
      "0x" + taskArguments.sourceChainId.toString(16).padStart(64, "0"),
    ] as const
    const veaAdapter: VeaAdapter = <VeaAdapter>(
      await veaAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await veaAdapter.deployed()
    console.log("VeaAdapter deployed to:", veaAdapter.address)
    if (taskArguments.verify) await verify(hre, veaAdapter, constructorArguments)
  })

// Deploy source chain
task("deploy:Vea:Reporter")
  .addParam("headerStorage", "address of the header storage contract", undefined, types.string)
  .addParam("yaho", "address of the Yaho contract", undefined, types.string)
  .addParam("veaInbox", "address of the Vea inbox contract", undefined, types.string)
  .addParam("adapter", "address of adapter contract", undefined, types.string)
  .addParam("targetChainId", "target chain id", undefined, types.int)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying VeaReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const veaReporterFactory: VeaReporter__factory = <VeaReporter__factory>(
      await hre.ethers.getContractFactory("VeaReporter")
    )
    const constructorArguments = [
      taskArguments.headerStorage,
      taskArguments.yaho,
      taskArguments.veaInbox,
      taskArguments.adapter,
      taskArguments.targetChainId,
    ] as const
    const veaReporter: VeaReporter = <VeaReporter>(
      await veaReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await veaReporter.deployed()
    console.log("VeaReporter deployed to:", veaReporter.address)
    if (taskArguments.verify) await verify(hre, veaReporter, constructorArguments)
  })
