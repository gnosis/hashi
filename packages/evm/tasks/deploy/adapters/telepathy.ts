import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { TelepathyAdapter } from "../../../types/contracts/adapters/Telepathy/TelepathyAdapter"
import type { TelepathyAdapter__factory } from "../../../types/factories/contracts/adapters/Telepathy/TelepathyAdapter__factory"
import { verify } from "../index"

task("deploy:adapter:TelepathyAdapter")
  .addParam("router", "address of the Telepathy router contract")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying TelepathyAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const telepathyAdapterFactory: TelepathyAdapter__factory = <TelepathyAdapter__factory>(
      await hre.ethers.getContractFactory("TelepathyAdapter")
    )
    const constructorArguments = [taskArguments.router] as const
    const telepathyAdapter: TelepathyAdapter = <TelepathyAdapter>(
      await telepathyAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await telepathyAdapter.deployed()
    console.log("TelepathyAdapter deployed to:", telepathyAdapter.address)
    if (taskArguments.verify) await verify(hre, telepathyAdapter, constructorArguments)
  })
