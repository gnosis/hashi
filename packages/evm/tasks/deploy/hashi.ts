import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import { verify } from "."
import type { Hashi } from "../../types/contracts/Hashi"
import type { ShoyuBashi } from "../../types/contracts/ShoyuBashi"
import type { HeaderStorage } from "../../types/contracts/utils/HeaderStorage"
import type { Hashi__factory } from "../../types/factories/contracts/Hashi__factory"
import type { ShoyuBashi__factory } from "../../types/factories/contracts/ShoyuBashi__factory"
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

task("deploy:ShoyuBashi")
  .addParam("owner", "address to set as the owner of this contract")
  .addParam("hashi", "address of the hashi contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying ShoyuBashi...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const shoyuBashiFactory: ShoyuBashi__factory = <ShoyuBashi__factory>(
      await hre.ethers.getContractFactory("ShoyuBashi")
    )
    const constructorArguments = [taskArguments.owner, taskArguments.hashi] as const
    const shoyuBashi: ShoyuBashi = <ShoyuBashi>(
      await shoyuBashiFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await shoyuBashi.deployed()
    console.log("ShoyuBashi deployed to:", shoyuBashi.address)
    if (taskArguments.verify) await verify(hre, shoyuBashi, constructorArguments)
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
