import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task, types } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import { verify } from ".."
import type { WormholeAdapter } from "../../../types/contracts/adapters/Wormhole/WormholeAdapter"
import type { WormholeHeaderReporter } from "../../../types/contracts/adapters/Wormhole/WormholeHeaderReporter"
import type { WormholeMessageRelay } from "../../../types/contracts/adapters/Wormhole/WormholeMessageRelay"
import type { WormholeAdapter__factory } from "../../../types/factories/contracts/adapters/Wormhole/WormholeAdapter__factory"
import type { WormholeHeaderReporter__factory } from "../../../types/factories/contracts/adapters/Wormhole/WormholeHeaderReporter__factory"
import type { WormholeMessageRelay__factory } from "../../../types/factories/contracts/adapters/Wormhole/WormholeMessageRelay__factory"

// Deploy on destination chain
task("deploy:Wormhole:Adapter")
  .addParam("wormhole", "address of the Wormhole contract", undefined, types.string)
  .addParam("reporter", "address of the hash reporter", undefined, types.string)
  .addParam("chainId", "source chain id", undefined, types.string)
  .addParam("wormholeChainId", "wormhole source chain id", undefined, types.string)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying WormholeAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const wormholeAdapterFactory: WormholeAdapter__factory = <WormholeAdapter__factory>(
      await hre.ethers.getContractFactory("WormholeAdapter")
    )
    const constructorArguments = [
      taskArguments.wormhole,
      taskArguments.reporter,
      taskArguments.chainId,
      taskArguments.wormholeChainId,
    ] as const
    const wormholeAdapter: WormholeAdapter = <WormholeAdapter>(
      await wormholeAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await wormholeAdapter.deployed()
    console.log("WormholeAdapter deployed to:", wormholeAdapter.address)
    if (taskArguments.verify) await verify(hre, wormholeAdapter, constructorArguments)
  })

// Deploy source chain
task("deploy:Wormhole:HeaderReporter")
  .addParam("wormhole", "address of the Wormhole contract", undefined, types.string)
  .addParam("headerStorage", "address of the header storage contract", undefined, types.string)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying WormholeHeaderReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const wormholeHeaderReporterFactory: WormholeHeaderReporter__factory = <WormholeHeaderReporter__factory>(
      await hre.ethers.getContractFactory("WormholeHeaderReporter")
    )
    const constructorArguments = [taskArguments.wormhole, taskArguments.headerStorage] as const
    const wormholeHeaderReporter: WormholeHeaderReporter = <WormholeHeaderReporter>(
      await wormholeHeaderReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await wormholeHeaderReporter.deployed()
    console.log("WormholeHeaderReporter deployed to:", wormholeHeaderReporter.address)
    if (taskArguments.verify) await verify(hre, wormholeHeaderReporter, constructorArguments)
  })

// Deploy source chain
task("deploy:Wormhole:MessageRelay")
  .addParam("wormhole", "address of the Wormhole contract", undefined, types.string)
  .addParam("yaho", "address of the Yaho contract", undefined, types.string)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying WormholeMessageRelay...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const wormholeMessageRelayFactory: WormholeMessageRelay__factory = <WormholeMessageRelay__factory>(
      await hre.ethers.getContractFactory("WormholeMessageRelay")
    )
    const constructorArguments = [taskArguments.wormhole, taskArguments.yaho] as const
    const wormholeMessageRelay: WormholeMessageRelay = <WormholeMessageRelay>(
      await wormholeMessageRelayFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await wormholeMessageRelay.deployed()
    console.log("WormholeMessageRelay deployed to:", wormholeMessageRelay.address)
    if (taskArguments.verify) await verify(hre, wormholeMessageRelay, constructorArguments)
  })
