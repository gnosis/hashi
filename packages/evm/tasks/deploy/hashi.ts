import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import { verify } from "."
import type { GiriGiriBashi } from "../../types/contracts/GiriGiriBashi"
import type { Hashi } from "../../types/contracts/Hashi"
import type { HeaderStorage } from "../../types/contracts/utils/HeaderStorage"
import type { GiriGiriBashi__factory } from "../../types/factories/contracts/GiriGiriBashi__factory"
import type { Hashi__factory } from "../../types/factories/contracts/Hashi__factory"
import type { HeaderStorage__factory } from "../../types/factories/contracts/utils/HeaderStorage__factory"

task("deploy:Hashi")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying Hashi...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const hashiFactory: Hashi__factory = <Hashi__factory>await hre.ethers.getContractFactory("Hashi")
    const hashi: Hashi = <Hashi>await hashiFactory.connect(signers[0]).deploy()
    await hashi.deployed()
    console.log("Hashi deployed to:", hashi.address)
    if (taskArguments.verify) await verify(hre, hashi)
  })

task("deploy:GiriGiriBashi")
  .addParam("owner", "address to set as the owner of this contract")
  .addParam("hashi", "address of the hashi contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying GiriGiriBashi...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const giriGiriBashiFactory: GiriGiriBashi__factory = <GiriGiriBashi__factory>(
      await hre.ethers.getContractFactory("GiriGiriBashi")
    )
    const constructorArguments = [taskArguments.owner, taskArguments.hashi] as const
    const giriGiriBashi: GiriGiriBashi = <GiriGiriBashi>(
      await giriGiriBashiFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await giriGiriBashi.deployed()
    console.log("GiriGiriBashi deployed to:", giriGiriBashi.address)
    if (taskArguments.verify) await verify(hre, giriGiriBashi, constructorArguments)
  })

task("deploy:HeaderStorage")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying HeaderStorage...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const headerStorageFactory: HeaderStorage__factory = <HeaderStorage__factory>(
      await hre.ethers.getContractFactory("HeaderStorage")
    )
    const headerStorage: HeaderStorage = <HeaderStorage>await headerStorageFactory.connect(signers[0]).deploy()
    await headerStorage.deployed()
    console.log("HeaderStorage deployed to:", headerStorage.address)
    if (taskArguments.verify) await verify(hre, headerStorage)
  })
