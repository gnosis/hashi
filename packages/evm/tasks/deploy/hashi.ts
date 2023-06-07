import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task, types } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import { verify } from "."
import type { Hashi } from "../../types/contracts/Hashi"
import type { Yaho } from "../../types/contracts/Yaho"
import type { Yaru } from "../../types/contracts/Yaru"
import type { GiriGiriBashi } from "../../types/contracts/ownable/GiriGiriBashi"
import type { ShoyuBashi } from "../../types/contracts/ownable/ShoyuBashi"
import type { HeaderStorage } from "../../types/contracts/utils/HeaderStorage"
import type { HashiModule } from "../../types/contracts/zodiac/HashiModule"
import type { Hashi__factory } from "../../types/factories/contracts/Hashi__factory"
import type { Yaho__factory } from "../../types/factories/contracts/Yaho__factory"
import type { Yaru__factory } from "../../types/factories/contracts/Yaru__factory"
import type { GiriGiriBashi__factory } from "../../types/factories/contracts/ownable/GiriGiriBashi__factory"
import type { ShoyuBashi__factory } from "../../types/factories/contracts/ownable/ShoyuBashi__factory"
import type { HeaderStorage__factory } from "../../types/factories/contracts/utils/HeaderStorage__factory"
import type { HashiModule__factory } from "../../types/factories/contracts/zodiac/HashiModule__factory"

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

task("deploy:GiriGiriBashi")
  .addParam("owner", "address to set as the owner of this contract")
  .addParam("hashi", "address of the hashi contract")
  .addParam("recipient", "address that will receive bonds for unsuccessful challenges")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying GiriGiriBashi...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const giriGiriBashiFactory: GiriGiriBashi__factory = <GiriGiriBashi__factory>(
      await hre.ethers.getContractFactory("GiriGiriBashi")
    )
    const constructorArguments = [taskArguments.owner, taskArguments.hashi, taskArguments.recipient] as const
    const giriGiriBashi: GiriGiriBashi = <GiriGiriBashi>(
      await giriGiriBashiFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await giriGiriBashi.deployed()
    console.log("giriGiriBashi deployed to:", giriGiriBashi.address)
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

task("deploy:Yaho")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying Yaho...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const yahoFactory: Yaho__factory = <Yaho__factory>await hre.ethers.getContractFactory("Yaho")
    const yaho: Yaho = <Yaho>await yahoFactory.connect(signers[0]).deploy()
    await yaho.deployed()
    console.log("yahoBashi deployed to:", yaho.address)
    if (taskArguments.verify) await verify(hre, yaho)
  })

task("deploy:Yaru")
  .addParam("hashi", "address of the hashi contract")
  .addParam("yaho", "address of the yaho instance to receive messages from")
  .addParam("chainid", "id of the chain to receive messages from", 1, types.int)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying Yaru...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const yaruFactory: Yaru__factory = <Yaru__factory>await hre.ethers.getContractFactory("Yaru")
    const constructorArguments = [taskArguments.hashi, taskArguments.yaho, taskArguments.chainid] as const
    const yaru: Yaru = <Yaru>await yaruFactory.connect(signers[0]).deploy(...constructorArguments)
    await yaru.deployed()
    console.log("yaru deployed to:", yaru.address)
    if (taskArguments.verify) await verify(hre, yaru, constructorArguments)
  })

task("deploy:HashiModule")
  .addParam("owner", "address to set as the owner of this contract")
  .addParam("avatar", "address that will execute transactions (probably a Safe)")
  .addParam("target", "address that this contract will call (probably a Safe)")
  .addParam("yaru", "address of the yaru instance that will call this contract")
  .addParam("controller", "address of the controller that can pass messages to this contract")
  .addParam("chainid", "id of the chain to receive messages from", 1, types.int)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying Hashi Module...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const hashiModuleFactory: HashiModule__factory = <HashiModule__factory>(
      await hre.ethers.getContractFactory("HashiModule")
    )
    const constructorArguments = [
      taskArguments.owner,
      taskArguments.avatar,
      taskArguments.target,
      taskArguments.yaru,
      taskArguments.controller,
      taskArguments.chainid,
    ] as const
    const hashiModule: HashiModule = <HashiModule>(
      await hashiModuleFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await hashiModule.deployed()
    console.log("hashi deployed to:", hashiModule.address)
    if (taskArguments.verify) await verify(hre, hashiModule, constructorArguments)
  })
