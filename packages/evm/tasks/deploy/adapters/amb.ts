import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task, types } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import { verify } from ".."
import type { AMBAdapter } from "../../../types/contracts/adapters/AMB/AMBAdapter"
import type { AMBReporter } from "../../../types/contracts/adapters/AMB/AMBReporter"
import type { AMBAdapter__factory } from "../../../types/factories/contracts/adapters/AMB/AMBAdapter__factory"
import { AMBReporter__factory } from "../../../types/factories/contracts/adapters/AMB/AMBReporter__factory"

// Deploy on destination chain
task("deploy:AMB:Adapter")
  .addParam("amb", "address of the AMB contract", undefined, types.string)
  .addParam("reporter", "address of the hash reporter", undefined, types.string)
  .addParam("sourceChainId", "sourceChainId of the source chain", undefined, types.int)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying AMBAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const ambAdapterFactory: AMBAdapter__factory = <AMBAdapter__factory>(
      await hre.ethers.getContractFactory("AMBAdapter")
    )

    const constructorArguments = [
      taskArguments.amb,
      taskArguments.reporter,
      "0x" + taskArguments.sourceChainId.toString(16).padStart(64, "0"),
    ] as const
    const ambAdapter: AMBAdapter = <AMBAdapter>(
      await ambAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await ambAdapter.deployed()
    console.log("AMBAdapter deployed to:", ambAdapter.address)
    if (taskArguments.verify) await verify(hre, ambAdapter, constructorArguments)
  })

// Deploy source chain
task("deploy:AMB:Reporter")
  .addParam("headerStorage", "address of the header storage contract", undefined, types.string)
  .addParam("yaho", "address of the Yaho contract", undefined, types.string)
  .addParam("amb", "address of the AMB contract", undefined, types.string)
  .addParam("targetChainId", "target chain id", undefined, types.int)
  .addParam("gas", "gas limit value used to call requireToPassMessage", 500000, types.int)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying AMBReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const ambReporterFactory: AMBReporter__factory = <AMBReporter__factory>(
      await hre.ethers.getContractFactory("AMBReporter")
    )
    const constructorArguments = [
      taskArguments.headerStorage,
      taskArguments.yaho,
      taskArguments.amb,
      taskArguments.targetChainId,
      taskArguments.gas,
    ] as const
    const ambReporter: AMBReporter = <AMBReporter>(
      await ambReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await ambReporter.deployed()
    console.log("AMBReporter deployed to:", ambReporter.address)
    if (taskArguments.verify) await verify(hre, ambReporter, constructorArguments)
  })
