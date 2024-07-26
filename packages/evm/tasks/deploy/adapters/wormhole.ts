import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task, types } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import { verify } from ".."
import type { WormholeAdapter } from "../../../types/contracts/adapters/Wormhole/WormholeAdapter"
import type { WormholeReporter } from "../../../types/contracts/adapters/Wormhole/WormholeReporter"
import type { WormholeAdapter__factory } from "../../../types/factories/contracts/adapters/Wormhole/WormholeAdapter__factory"
import type { WormholeReporter__factory } from "../../../types/factories/contracts/adapters/Wormhole/WormholeReporter__factory"

// Deploy on destination chain
task("deploy:Wormhole:Adapter")
  .addParam("wormhole", "address of the Wormhole contract", undefined, types.string)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying WormholeAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const wormholeAdapterFactory: WormholeAdapter__factory = <WormholeAdapter__factory>(
      await hre.ethers.getContractFactory("WormholeAdapter")
    )
    const constructorArguments = [taskArguments.wormhole] as const
    const wormholeAdapter: WormholeAdapter = <WormholeAdapter>(
      await wormholeAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await wormholeAdapter.deployed()
    console.log("WormholeAdapter deployed to:", wormholeAdapter.address)
    if (taskArguments.verify) await verify(hre, wormholeAdapter, constructorArguments)
  })

// Deploy source chain
task("deploy:Wormhole:Reporter")
  .addParam("yaho", "address of the Yaho contract", undefined, types.string)
  .addParam("wormhole", "address of the Wormhole contract", undefined, types.string)
  .addParam("headerstorage", "address of the header storage contract", undefined, types.string)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying WormholeReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const wormholeReporterFactory: WormholeReporter__factory = <WormholeReporter__factory>(
      await hre.ethers.getContractFactory("WormholeReporter")
    )
    const constructorArguments = [taskArguments.headerstorage, taskArguments.yaho, taskArguments.wormhole] as const
    const wormholeReporter: WormholeReporter = <WormholeReporter>(
      await wormholeReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await wormholeReporter.deployed()
    console.log("WormholeHeaderReporter deployed to:", wormholeReporter.address)
    if (taskArguments.verify) await verify(hre, wormholeReporter, constructorArguments)
  })
