import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import { verify } from "."
import type { Hashi } from "../../types/contracts/Hashi"
import type { Yaho } from "../../types/contracts/Yaho"
import type { Yaru } from "../../types/contracts/Yaru"
import type { HeaderReporter } from "../../types/contracts/headers/HeaderReporter"
import type { HeaderStorage } from "../../types/contracts/headers/HeaderStorage"
import type { HeaderVault } from "../../types/contracts/headers/HeaderVault"
import type { ShoyuBashi } from "../../types/contracts/ownable/ShoyuBashi"
import type { Hashi__factory } from "../../types/factories/contracts/Hashi__factory"
import type { Yaho__factory } from "../../types/factories/contracts/Yaho__factory"
import type { Yaru__factory } from "../../types/factories/contracts/Yaru__factory"
import type { HeaderReporter__factory } from "../../types/factories/contracts/headers/HeaderReporter__factory"
import type { HeaderStorage__factory } from "../../types/factories/contracts/headers/HeaderStorage__factory"
import type { HeaderVault__factory } from "../../types/factories/contracts/headers/HeaderVault__factory"
import type { ShoyuBashi__factory } from "../../types/factories/contracts/ownable/ShoyuBashi__factory"

// NOTE: Deploy on the source chain
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

task("deploy:HeaderReporter")
  .addParam("headerStorage", "address of the header storage contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying HeaderReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const headerReporterFactory: HeaderReporter__factory = <HeaderReporter__factory>(
      await hre.ethers.getContractFactory("HeaderReporter")
    )
    const constructorArguments = [taskArguments.headerStorage] as const
    const headerReporter: HeaderReporter = <HeaderReporter>(
      await headerReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await headerReporter.deployed()
    console.log("HeaderReporter deployed to:", headerReporter.address)
    if (taskArguments.verify) await verify(hre, headerReporter)
  })

task("deploy:Yaho")
  .addParam("headerReporter", "address of the header reporter contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying Yaho...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const yahoFactory: Yaho__factory = <Yaho__factory>await hre.ethers.getContractFactory("Yaho")
    const constructorArguments = [taskArguments.headerReporter] as const
    const yaho: Yaho = <Yaho>await yahoFactory.connect(signers[0]).deploy(...constructorArguments)
    await yaho.deployed()
    console.log("Yaho deployed to:", yaho.address)
    if (taskArguments.verify) await verify(hre, yaho)
  })

// NOTE: Deploy on the destination chain
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

task("deploy:HeaderVault")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying HeaderVault...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const headerVaultFactory: HeaderVault__factory = <HeaderVault__factory>(
      await hre.ethers.getContractFactory("HeaderVault")
    )
    const headerVault: HeaderVault = <HeaderVault>await headerVaultFactory.connect(signers[0]).deploy()
    await headerVault.deployed()
    console.log("HeaderVault deployed to:", headerVault.address)
    if (taskArguments.verify) await verify(hre, headerVault)
  })

task("deploy:Yaru")
  .addParam("hashi", "address of the hashi contract")
  .addParam("headerVault", "address of the header vault instance")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying Yaru...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const yaruFactory: Yaru__factory = <Yaru__factory>await hre.ethers.getContractFactory("Yaru")
    const constructorArguments = [taskArguments.hashi, taskArguments.headerVault] as const
    const yaru: Yaru = <Yaru>await yaruFactory.connect(signers[0]).deploy(...constructorArguments)
    await yaru.deployed()
    console.log("Yaru deployed to:", yaru.address)
    if (taskArguments.verify) await verify(hre, yaru, constructorArguments)
  })

task("deploy:HeaderVault:InitializeYaru")
  .addParam("headerVault", "address of the header vault contract")
  .addParam("yaru", "address of the yaru contract")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const headerVaultFactory: HeaderVault__factory = <HeaderVault__factory>(
      await hre.ethers.getContractFactory("HeaderVault")
    )
    const headerVault: HeaderVault = <HeaderVault>await headerVaultFactory.attach(taskArguments.headerVault)
    await headerVault.initializeYaru(taskArguments.yaru)
    console.log("Yaru initialized!")
  })

task("deploy:Yaru:InitializeForChainId")
  .addParam("chainId", "chain id where yaho is deployed")
  .addParam("yaho", "address of the yaho contract")
  .addParam("yaru", "address of the yaru contract")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const yaruFactory: Yaru__factory = <Yaru__factory>await hre.ethers.getContractFactory("Yaru")
    const yaru: Yaru = <Yaru>await yaruFactory.connect(signers[0]).attach(taskArguments.yaru)
    await yaru.initializeForChainId(taskArguments.chainId, taskArguments.yaho)
    console.log("InitializeForChainId completed!")
  })
