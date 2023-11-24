import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { HyperlaneAdapter } from "../../../types/contracts/adapters/Hyperlane/HyperlaneAdapter"
import type { HyperlaneHeaderReporter } from "../../../types/contracts/adapters/Hyperlane/HyperlaneHeaderReporter"
import type { HyperlaneMessageRelay } from "../../../types/contracts/adapters/Hyperlane/HyperlaneMessageRelay"
import type { HyperlaneAdapter__factory } from "../../../types/factories/contracts/adapters/Hyperlane/HyperlaneAdapter__factory"
import type { HyperlaneHeaderReporter__factory } from "../../../types/factories/contracts/adapters/Hyperlane/HyperlaneHeaderReporter__factory"
import type { HyperlaneMessageRelay__factory } from "../../../types/factories/contracts/adapters/Hyperlane/HyperlaneMessageRelay__factory"
import { verify } from "../index"

task("deploy:adapter:HyperlaneAdapter")
  .addParam("chainId", "chain id of the reporter contract")
  .addParam("reporter", "address of the reporter contract")
  .addParam("mailbox", "address of the Hyperlane mailbox contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying HyperlaneAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const hyperlaneAdapterFactory: HyperlaneAdapter__factory = <HyperlaneAdapter__factory>(
      await hre.ethers.getContractFactory("HyperlaneAdapter")
    )
    const constructorArguments = [
      taskArguments.chainId,
      taskArguments.reporter,
      taskArguments.mailbox,
      taskArguments.chainId,
      "0x" + "00".repeat(12) + taskArguments.reporter.slice(2),
    ] as const
    const hyperlaneAdapter: HyperlaneAdapter = <HyperlaneAdapter>(
      await hyperlaneAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await hyperlaneAdapter.deployed()
    console.log("HyperlaneAdapter deployed to:", hyperlaneAdapter.address)
    if (taskArguments.verify) await verify(hre, hyperlaneAdapter)
  })

task("deploy:adapter:HyperlaneHeaderReporter")
  .addParam("chainId", "chain id of the adapter contract")
  .addParam("headerStorage", "address of the header storage contract")
  .addParam("mailbox", "address of the Hyperlane mailbox contract")
  .addParam("paymaster", "address of the Hyperlane paymaster contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying HyperlaneHeaderReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const hyperlaneHeaderReporterFactory: HyperlaneHeaderReporter__factory = <HyperlaneHeaderReporter__factory>(
      await hre.ethers.getContractFactory("HyperlaneHeaderReporter")
    )
    const constructorArguments = [
      taskArguments.headerStorage,
      taskArguments.chainId,
      taskArguments.mailbox,
      taskArguments.paymaster,
      taskArguments.chainId,
    ] as const
    const hyperlaneHeaderReporter: HyperlaneHeaderReporter = <HyperlaneHeaderReporter>(
      await hyperlaneHeaderReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await hyperlaneHeaderReporter.deployed()
    console.log("HyperlaneHeaderReporter deployed to:", hyperlaneHeaderReporter.address)
    if (taskArguments.verify) await verify(hre, hyperlaneHeaderReporter)
  })

task("deploy:adapter:HyperlaneMessageRelay")
  .addParam("chainId", "chain id of the adapter contract")
  .addParam("yaho", "address of the Yaho contract")
  .addParam("mailbox", "address of the Hyperlane mailbox contract")
  .addParam("paymaster", "address of the Hyperlane paymaster contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying HyperlaneMessageRelay...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const hyperlaneMessageRelayFactory: HyperlaneMessageRelay__factory = <HyperlaneMessageRelay__factory>(
      await hre.ethers.getContractFactory("HyperlaneMessageRelay")
    )
    const constructorArguments = [
      taskArguments.yaho,
      taskArguments.chainId,
      taskArguments.mailbox,
      taskArguments.paymaster,
      taskArguments.chainId,
    ] as const
    const hyperlaneMessageRelay: HyperlaneMessageRelay = <HyperlaneMessageRelay>(
      await hyperlaneMessageRelayFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await hyperlaneMessageRelay.deployed()
    console.log("HyperlaneMessageRelay deployed to:", hyperlaneMessageRelay.address)
    if (taskArguments.verify) await verify(hre, hyperlaneMessageRelay)
  })
