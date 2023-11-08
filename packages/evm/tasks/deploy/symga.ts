import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task, types } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import { verify } from "."
import type { SygmaAdapter } from "../../types/contracts/adapters/Sygma/SygmaAdapter"
import type { SygmaMessageRelay } from "../../types/contracts/adapters/Sygma/SygmaMessageRelay"
import type { SygmaAdapter__factory } from "../../types/factories/contracts/adapters/Sygma/SygmaAdapter__factory"
import { SygmaMessageRelay__factory } from "../../types/factories/contracts/adapters/Sygma/SygmaMessageRelay__factory"

// Deploy source chain
task("deploy:Sygma:MessageRelay")
  .addParam("sygma", "address of the Sygma contract", undefined, types.string)
  .addParam("yaho", "address of the yaho contract", undefined, types.string)
  .addParam("resourceID", "sygma resource id", undefined, types.string)
  .addParam("defaultSygmaAdapter", "address of default sygma adapter", undefined, types.string)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying SygmaMessageRelay...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const sygmaMessageRelayFactory: SygmaMessageRelay__factory = <SygmaMessageRelay__factory>(
      await hre.ethers.getContractFactory("SygmaMessageRelay")
    )
    const constructorArguments = [
      taskArguments.sygma,
      taskArguments.yaho,
      taskArguments.resourceID,
      taskArguments.defaultSygmaAdapter,
    ] as const
    const sygmaMessageRelay: SygmaMessageRelay = <SygmaMessageRelay>(
      await sygmaMessageRelayFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await sygmaMessageRelay.deployed()
    console.log("SygmaMessageRelay deployed to:", sygmaMessageRelay.address)
    if (taskArguments.verify) await verify(hre, sygmaMessageRelay, constructorArguments)
  })

// Deploy on destination chain

// Handler on Gnosis: 0x10c6BDcE6Fd989A3E115879c94a71c91F3541809
task("deploy:Sygma:Adapter")
  .addParam("handler", "address of the Sygma handler contract", undefined, types.string)
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying SygmaAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const sygmaAdapterFactory: SygmaAdapter__factory = <SygmaAdapter__factory>(
      await hre.ethers.getContractFactory("SygmaAdapter")
    )
    const constructorArguments = [taskArguments.handler] as const
    const sygmaAdapter: SygmaAdapter = <SygmaAdapter>(
      await sygmaAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await sygmaAdapter.deployed()
    console.log("SygmaAdapter deployed to:", sygmaAdapter.address)
    if (taskArguments.verify) await verify(hre, sygmaAdapter, constructorArguments)
  })

// TODO: setReporter
