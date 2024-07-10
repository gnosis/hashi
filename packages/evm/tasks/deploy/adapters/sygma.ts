import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task, types } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import { verify } from ".."
import type { SygmaAdapter } from "../../../types/contracts/adapters/Sygma/SygmaAdapter"
import type { SygmaReporter } from "../../../types/contracts/adapters/Sygma/SygmaReporter"
import type { SygmaAdapter__factory } from "../../../types/factories/contracts/adapters/Sygma/SygmaAdapter__factory"
import type { SygmaReporter__factory } from "../../../types/factories/contracts/adapters/Sygma/SygmaReporter__factory"

task("deploy:SygmaReporter")
  .addParam("headerStorage", "address of the HeaderStorage contract", undefined, types.string)
  .addParam("yaho", "address of the Yaho contract", undefined, types.string)
  .addParam("bridge", "address of the Sygma contract", undefined, types.string)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying SygmaReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const sygmaReporterFactory: SygmaReporter__factory = <SygmaReporter__factory>(
      await hre.ethers.getContractFactory("SygmaReporter")
    )
    const constructorArguments = [taskArguments.headerStorage, taskArguments.yaho, taskArguments.bridge] as const
    const sygmaReporter: SygmaReporter = <SygmaReporter>(
      await sygmaReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await sygmaReporter.deployed()
    console.log("SygmaReporter deployed to:", sygmaReporter.address)
    if (taskArguments.verify) await verify(hre, sygmaReporter, constructorArguments)
  })

task("deploy:SygmaAdapter")
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
