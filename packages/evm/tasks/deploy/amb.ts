import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task, types } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import { verify } from "."
import type { AMBAdapter } from "../../types/contracts/adapters/AMB/AMBAdapter"
import type { AMBAdapter__factory } from "../../types/factories/contracts/adapters/AMB/AMBAdapter__factory"

task("deploy:AMB:Adapter")
  .addParam("amb", "address of the AMB contract", undefined, types.string)
  .addParam("reporter", "address of the hash reporter", undefined, types.string)
  .addParam("chainId", "chainId of the source chain", undefined, types.int)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying GiriGiriBashi...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const ambAdapterFactory: AMBAdapter__factory = <AMBAdapter__factory>(
      await hre.ethers.getContractFactory("AMBAdapter")
    )
    const constructorArguments = [taskArguments.amb, taskArguments.reporter, taskArguments.chainId] as const
    const ambAdapter: AMBAdapter = <AMBAdapter>(
      await ambAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await ambAdapter.deployed()
    console.log("GiriGiriBashi deployed to:", ambAdapter.address)
    if (taskArguments.verify) await verify(hre, ambAdapter, constructorArguments)
  })
