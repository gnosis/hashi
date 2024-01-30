import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task, types } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import { verify } from ".."
import type { AMBAdapter } from "../../../types/contracts/adapters/AMB/AMBAdapter"
import type { AMBHeaderReporter } from "../../../types/contracts/adapters/AMB/AMBHeaderReporter"
import type { AMBAdapter__factory } from "../../../types/factories/contracts/adapters/AMB/AMBAdapter__factory"
import { AMBHeaderReporter__factory } from "../../../types/factories/contracts/adapters/AMB/AMBHeaderReporter__factory"

// Deploy on destination chain
task("deploy:AMB:Adapter")
  .addParam("amb", "address of the AMB contract", undefined, types.string)
  .addParam("reporter", "address of the hash reporter", undefined, types.string)
  .addParam("chainId", "chainId of the source chain", undefined, types.int)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying AMBAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const ambAdapterFactory: AMBAdapter__factory = <AMBAdapter__factory>(
      await hre.ethers.getContractFactory("AMBAdapter")
    )
    const constructorArguments = [taskArguments.amb, taskArguments.reporter, taskArguments.chainId] as const
    const ambAdapter: AMBAdapter = <AMBAdapter>(
      await ambAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await ambAdapter.deployed()
    console.log("AMBAdapter deployed to:", ambAdapter.address)
    if (taskArguments.verify) await verify(hre, ambAdapter, constructorArguments)
  })

// Deploy source chain
task("deploy:AMB:HeaderReporter")
  .addParam("amb", "address of the AMB contract", undefined, types.string)
  .addParam("headerStorage", "address of the header storage contract", undefined, types.string)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying AMBHeaderReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const ambHeaderReporterFactory: AMBHeaderReporter__factory = <AMBHeaderReporter__factory>(
      await hre.ethers.getContractFactory("AMBHeaderReporter")
    )
    const constructorArguments = [taskArguments.amb, taskArguments.reporter, taskArguments.chainId] as const
    const ambHeaderReporter: AMBHeaderReporter = <AMBHeaderReporter>(
      await ambHeaderReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await ambHeaderReporter.deployed()
    console.log("AMBHeaderReporter deployed to:", ambHeaderReporter.address)
    if (taskArguments.verify) await verify(hre, ambHeaderReporter, constructorArguments)
  })
