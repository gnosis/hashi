import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task, types } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { RouterAdapter } from "../../../types/contracts/adapters/Router/RouterAdapter.sol/RouterAdapter"
import type { RouterReporter } from "../../../types/contracts/adapters/Router/RouterReporter.sol/RouterReporter"
import type { RouterAdapter__factory } from "../../../types/factories/contracts/adapters/Router/RouterAdapter.sol/RouterAdapter__factory"
import type { RouterReporter__factory } from "../../../types/factories/contracts/adapters/Router/RouterReporter.sol/RouterReporter__factory"
import { verify } from "../index"

task("deploy:adapter:RouterAdapter")
  .addParam("routerGateway", "address of the Router gateway contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying RouterAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const routerAdapterFactory: RouterAdapter__factory = <RouterAdapter__factory>(
      await hre.ethers.getContractFactory("RouterAdapter")
    )
    const constructorArguments = [taskArguments.routerGateway] as const
    const routerAdapter: RouterAdapter = <RouterAdapter>(
      await routerAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await routerAdapter.deployed()
    console.log("RouterAdapter deployed to:", routerAdapter.address)
    if (taskArguments.verify) await verify(hre, routerAdapter, constructorArguments)
  })

task("deploy:adapter:RouterReporter")
  .addParam("headerStorage", "address of the header storage contract")
  .addParam("yaho", "address of the Yaho contract", undefined, types.string)
  .addParam("routerGateway", "address of the Router gateway contract")
  .addParam("routerGasStation", "address of the Router gas station contract")
  .addParam(
    "routerFeePayer",
    "address of the fee payer for this contract (https://docs.routerprotocol.com/develop/message-transfer-via-crosstalk/evm-guides/iDapp-functions/setDappMetadata)",
  )
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying RouterReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const routerReporterFactory: RouterReporter__factory = <RouterReporter__factory>(
      await hre.ethers.getContractFactory("RouterReporter")
    )
    const constructorArguments = [
      taskArguments.headerStorage,
      taskArguments.yaho,
      taskArguments.routerGateway,
      taskArguments.routerGasStation,
      taskArguments.routerFeePayer,
    ] as const
    const routerReporter: RouterReporter = <RouterReporter>(
      await routerReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await routerReporter.deployed()
    console.log("RouterReporter deployed to:", routerReporter.address)
    if (taskArguments.verify) await verify(hre, routerReporter, constructorArguments)
  })
