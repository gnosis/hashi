import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { AxiomV02 } from "../../../types/contracts/adapters/Axiom/AxiomV02"
import type { AxiomV02StoragePf } from "../../../types/contracts/adapters/Axiom/AxiomV02StoragePf"
import type { AxiomV02StoragePf__factory } from "../../../types/factories/contracts/adapters/Axiom/AxiomV02StoragePf__factory"
import type { AxiomV02__factory } from "../../../types/factories/contracts/adapters/Axiom/AxiomV02__factory"
import { verify } from "../index"

task("deploy:adapter:AxiomV02")
  .addParam("oldAxiom", "address of AxiomV0 contract, version 0.1")
  .addParam("verifier", "address of the snark verifier contract for storage proofs")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying AxiomV02...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const axiomV02Factory: AxiomV02__factory = <AxiomV02__factory>await hre.ethers.getContractFactory("AxiomV02")
    const constructorArguments = [taskArguments.oldAxiom, taskArguments.verifier] as const
    const axiomV02: AxiomV02 = <AxiomV02>await axiomV02Factory.connect(signers[0]).deploy(...constructorArguments)
    await axiomV02.deployed()
    console.log("AxiomV02 deployed to:", axiomV02.address)
    if (taskArguments.verify) await verify(hre, axiomV02, constructorArguments)
  })

task("deploy:adapter:AxiomV02StoragePf")
  .addParam("axiom", "address of AxiomV0 contract")
  .addParam("verifier", "address of the snark verifier contract for storage proofs")
  .addParam("hashi", "address of the hashi contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying AxiomV02StoragePf...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const axiomV02StoragePfFactory: AxiomV02StoragePf__factory = <AxiomV02StoragePf__factory>(
      await hre.ethers.getContractFactory("AxiomV02StoragePf")
    )
    const constructorArguments = [taskArguments.axiom, taskArguments.verifier, taskArguments.hashi] as const
    const axiomV02StoragePf: AxiomV02StoragePf = <AxiomV02StoragePf>(
      await axiomV02StoragePfFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await axiomV02StoragePf.deployed()
    console.log("AxiomV02StoragePf deployed to:", axiomV02StoragePf.address)
    if (taskArguments.verify) await verify(hre, axiomV02StoragePf, constructorArguments)
  })
