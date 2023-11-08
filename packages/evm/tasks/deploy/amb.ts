import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { ethers } from "ethers"
import { task, types } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import { verify } from "."
import type { AMBAdapter } from "../../types/contracts/adapters/AMB/AMBAdapter"
import type { AMBMessageRelay } from "../../types/contracts/adapters/AMB/AMBMessageRelay"
import type { AMBAdapter__factory } from "../../types/factories/contracts/adapters/AMB/AMBAdapter__factory"
import { AMBMessageRelay__factory } from "../../types/factories/contracts/adapters/AMB/AMBMessageRelay__factory"

const toBytes32 = (_n: number) => ethers.utils.hexZeroPad(ethers.utils.hexlify(_n), 32)

// Deploy source chain
task("deploy:AMB:MessageRelay")
  .addParam("amb", "address of the AMB contract", undefined, types.string)
  .addParam("yaho", "address of the yaho contract", undefined, types.string)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying AMBMessageRelay...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const ambMessageRelayFactory: AMBMessageRelay__factory = <AMBMessageRelay__factory>(
      await hre.ethers.getContractFactory("AMBMessageRelay")
    )
    const constructorArguments = [taskArguments.amb, taskArguments.yaho] as const
    const ambMessageRelay: AMBMessageRelay = <AMBMessageRelay>(
      await ambMessageRelayFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await ambMessageRelay.deployed()
    console.log("AMBMessageRelay deployed to:", ambMessageRelay.address)
    if (taskArguments.verify) await verify(hre, ambMessageRelay, constructorArguments)
  })

// Deploy on destination chain
task("deploy:AMB:Adapter")
  .addParam("amb", "address of the AMB contract", undefined, types.string)
  .addParam("messageRelay", "address of the message relay", undefined, types.string)
  .addParam("chainId", "chainId of the source chain", undefined, types.int)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying AMBAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const ambAdapterFactory: AMBAdapter__factory = <AMBAdapter__factory>(
      await hre.ethers.getContractFactory("AMBAdapter")
    )
    const constructorArguments = [
      taskArguments.amb,
      taskArguments.messageRelay,
      toBytes32(taskArguments.chainId),
    ] as const
    const ambAdapter: AMBAdapter = <AMBAdapter>(
      await ambAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await ambAdapter.deployed()
    console.log("AMBAdapter deployed to:", ambAdapter.address)
    if (taskArguments.verify) await verify(hre, ambAdapter, constructorArguments)
  })
