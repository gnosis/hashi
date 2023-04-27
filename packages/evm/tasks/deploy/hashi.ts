import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { Contract } from "ethers"
import { task } from "hardhat/config"
import type { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types"

import type { GiriGiriBashi } from "../../types/contracts/GiriGiriBashi"
import type { Hashi } from "../../types/contracts/Hashi"
import type { GiriGiriBashi__factory } from "../../types/factories/contracts/GiriGiriBashi__factory"
import { Hashi__factory } from "../../types/factories/contracts/Hashi__factory"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const verify = async (hre: HardhatRuntimeEnvironment, contract: Contract, constructorArguments: any = []) => {
  console.log("Waiting for 5 confirmations...")
  await contract.deployTransaction.wait(5)
  console.log("Verifying contract...")
  try {
    await hre.run("verify:verify", {
      address: contract.address,
      constructorArguments,
    })
  } catch (e) {
    if (
      e instanceof Error &&
      e.stack &&
      (e.stack.indexOf("Reason: Already Verified") > -1 ||
        e.stack.indexOf("Contract source code already verified") > -1)
    ) {
      console.log("  ✔ Contract is already verified")
    } else {
      console.log(
        "  ✘ Verifying the contract failed. This is probably because Etherscan is still indexing the contract. Try running this same command again in a few seconds.",
      )
      throw e
    }
  }
}

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
