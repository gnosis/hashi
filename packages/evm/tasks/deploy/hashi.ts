import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { GiriGiriBashi } from "../../types/contracts/GiriGiriBashi"
import type { Hashi } from "../../types/contracts/Hashi"
import type { GiriGiriBashi__factory } from "../../types/factories/contracts/GiriGiriBashi__factory"
import type { Hashi__factory } from "../../types/factories/contracts/Hashi__factory"

task("deploy:Hashi").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const signers: SignerWithAddress[] = await ethers.getSigners()
  const hashiFactory: Hashi__factory = <Hashi__factory>await ethers.getContractFactory("Hashi")
  const hashi: Hashi = <Hashi>await hashiFactory.connect(signers[0]).deploy()
  await hashi.deployed()
  console.log("Hashi deployed to: ", hashi.address)
})

task("deploy:GiriGiriBashi")
  .addParam("owner", "address to set as the owner of this contract")
  .addParam("hashi", "address of the hashi contract")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const signers: SignerWithAddress[] = await ethers.getSigners()
    const giriGiriBashiFactory: GiriGiriBashi__factory = <GiriGiriBashi__factory>(
      await ethers.getContractFactory("GiriGiriBashi")
    )
    const giriGiriBashi: GiriGiriBashi = <GiriGiriBashi>(
      await giriGiriBashiFactory.connect(signers[0]).deploy(taskArguments.owner, taskArguments.hashi)
    )
    await giriGiriBashi.deployed()
    console.log("GiriGiriBashi deployed to: ", giriGiriBashi.address)
  })
