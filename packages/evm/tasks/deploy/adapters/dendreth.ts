import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { DendrETHAdapter } from "../../../types/contracts/adapters/DendrETH/DendrETHAdapter"
import type { DendrETHAdapter__factory } from "../../../types/factories/contracts/adapters/DendrETH/DendrETHAdapter__factory"
import { verify } from "../index"

task("deploy:adapter:DendrETHAdapter")
  .addParam("dendreth", "address of the DendrETH contract")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying DendrETHAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const dendrETHAdapterFactory: DendrETHAdapter__factory = <DendrETHAdapter__factory>(
      await hre.ethers.getContractFactory("DendrETHAdapter")
    )
    const constructorArguments = [taskArguments.dendreth] as const
    const dendrETHAdapter: DendrETHAdapter = <DendrETHAdapter>(
      await dendrETHAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await dendrETHAdapter.deployed()
    console.log("DendrETHAdapter deployed to:", dendrETHAdapter.address)
    if (taskArguments.verify) await verify(hre, dendrETHAdapter)
  })
