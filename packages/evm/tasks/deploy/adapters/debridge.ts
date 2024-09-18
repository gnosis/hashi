import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { DeBridgeAdapter } from "../../../types/contracts/adapters/DeBridge/DeBridgeAdapter"
import type { DeBridgeReporter } from "../../../types/contracts/adapters/DeBridge/DeBridgeReporter"
import type { DeBridgeAdapter__factory } from "../../../types/factories/contracts/adapters/DeBridge/DeBridgeAdapter__factory"
import type { DeBridgeReporter__factory } from "../../../types/factories/contracts/adapters/DeBridge/DeBridgeReporter__factory"
import { verify } from "../index"

task("deploy:DeBridgeAdapter")
  .addParam("deBridgeGate", "address of the DeBridge gate contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying DeBridgeAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const deBridgeAdapterFactory: DeBridgeAdapter__factory = <DeBridgeAdapter__factory>(
      await hre.ethers.getContractFactory("DeBridgeAdapter")
    )
    const constructorArguments = [taskArguments.deBridgeGate] as const
    const deBridgeAdapter: DeBridgeAdapter = <DeBridgeAdapter>(
      await deBridgeAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await deBridgeAdapter.deployed()
    console.log("DeBridgeAdapter deployed to:", deBridgeAdapter.address)
    if (taskArguments.verify) await verify(hre, deBridgeAdapter, constructorArguments)
  })

task("deploy:DeBridgeReporter")
  .addParam("headerStorage", "address of the header storage contract")
  .addParam("yaho", "address of the Yaho contract")
  .addParam("deBridgeGate", "address of the DeBridge gate contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying DeBridgeReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const deBridgeReporterFactory: DeBridgeReporter__factory = <DeBridgeReporter__factory>(
      await hre.ethers.getContractFactory("DeBridgeReporter")
    )
    const constructorArguments = [taskArguments.headerStorage, taskArguments.yaho, taskArguments.deBridgeGate] as const
    const deBridgeReporter: DeBridgeReporter = <DeBridgeReporter>(
      await deBridgeReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await deBridgeReporter.deployed()
    console.log("DeBridgeReporter deployed to:", deBridgeReporter.address)
    if (taskArguments.verify) await verify(hre, deBridgeReporter, constructorArguments)
  })
