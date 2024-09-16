import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { HyperbridgeAdapter } from "../../../types/contracts/adapters/Hyperbridge/HyperbridgeAdapter"
import type { HyperbridgeReporter } from "../../../types/contracts/adapters/Hyperbridge/HyperbridgeReporter"
import type { HyperbridgeAdapter__factory } from "../../../types/factories/contracts/adapters/Hyperbridge/HyperbridgeAdapter__factory"
import type { HyperbridgeReporter__factory } from "../../../types/factories/contracts/adapters/Hyperbridge/HyperbridgeReporter__factory"
import { verify } from "../index"

task("deploy:HyperbridgeAdapter")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying HyperbridgeAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const HyperbridgeAdapterFactory: HyperbridgeAdapter__factory = <HyperbridgeAdapter__factory>(
      await hre.ethers.getContractFactory("HyperbridgeAdapter")
    )
    const constructorArguments = [] as const
    const HyperbridgeAdapter: HyperbridgeAdapter = <HyperbridgeAdapter>(
      await HyperbridgeAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await HyperbridgeAdapter.deployed()
    console.log("HyperbridgeAdapter deployed to:", HyperbridgeAdapter.address)
    if (taskArguments.verify) await verify(hre, HyperbridgeAdapter, constructorArguments)
  })

task("deploy:HyperbridgeReporter")
  .addParam("headerStorage", "address of the header storage contract")
  .addParam("yaho", "address of the Yaho contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying HyperbridgeReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const HyperbridgeReporterFactory: HyperbridgeReporter__factory = <HyperbridgeReporter__factory>(
      await hre.ethers.getContractFactory("HyperbridgeReporter")
    )
    const constructorArguments = [taskArguments.headerStorage, taskArguments.yaho] as const
    const HyperbridgeReporter: HyperbridgeReporter = <HyperbridgeReporter>(
      await HyperbridgeReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await HyperbridgeReporter.deployed()
    console.log("HyperbridgeReporter deployed to:", HyperbridgeReporter.address)
    if (taskArguments.verify) await verify(hre, HyperbridgeReporter, constructorArguments)
  })
