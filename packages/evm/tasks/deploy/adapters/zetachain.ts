import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { ZetaAdapter } from "../../../types/contracts/adapters/ZetaChain/ZetaAdapter"
import type { ZetaHeaderReporter } from "../../../types/contracts/adapters/ZetaChain/ZetaHeaderReporter"
import type { ZetaMessageRelay } from "../../../types/contracts/adapters/ZetaChain/ZetaMessageRelay"
import type { ZetaAdapter__factory } from "../../../types/factories/contracts/adapters/ZetaChain/ZetaAdapter__factory"
import type { ZetaHeaderReporter__factory } from "../../../types/factories/contracts/adapters/ZetaChain/ZetaHeaderReporter__factory"
import type { ZetaMessageRelay__factory } from "../../../types/factories/contracts/adapters/ZetaChain/ZetaMessageRelay__factory"
import { verify } from "../index"

task("deploy:adapter:ZetaAdapter")
  .addParam("chainId", "chain id of the reporter contract")
  .addParam("reporter", "address of the reporter contract")
  .addParam("zetaConnector", "address of the ZetaChain connector contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying ZetaAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const zetaAdapterFactory: ZetaAdapter__factory = <ZetaAdapter__factory>(
      await hre.ethers.getContractFactory("ZetaAdapter")
    )
    const constructorArguments = [
      taskArguments.chainId,
      taskArguments.reporter,
      taskArguments.zetaConnector,
      taskArguments.reporter,
    ] as const
    const zetaAdapter: ZetaAdapter = <ZetaAdapter>(
      await zetaAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await zetaAdapter.deployed()
    console.log("ZetaAdapter deployed to:", zetaAdapter.address)
    if (taskArguments.verify) await verify(hre, zetaAdapter)
  })

task("deploy:adapter:ZetaHeaderReporter")
  .addParam("chainId", "chain id of the adapter contract")
  .addParam("headerStorage", "address of the header storage contract")
  .addParam("zetaConnector", "address of the ZetaChain connector contract")
  .addParam("zetaToken", "address of the ZETA token contract")
  .addParam("zetaConsumer", "address of the ZetaChain consumer contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying ZetaHeaderReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const zetaHeaderReporterFactory: ZetaHeaderReporter__factory = <ZetaHeaderReporter__factory>(
      await hre.ethers.getContractFactory("ZetaHeaderReporter")
    )
    const constructorArguments = [
      taskArguments.headerStorage,
      taskArguments.chainId,
      taskArguments.zetaConnector,
      taskArguments.zetaToken,
      taskArguments.zetaConsumer,
    ] as const
    const zetaHeaderReporter: ZetaHeaderReporter = <ZetaHeaderReporter>(
      await zetaHeaderReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await zetaHeaderReporter.deployed()
    console.log("ZetaHeaderReporter deployed to:", zetaHeaderReporter.address)
    if (taskArguments.verify) await verify(hre, zetaHeaderReporter)
  })

task("deploy:adapter:ZetaMessageRelay")
  .addParam("chainId", "chain id of the adapter contract")
  .addParam("yaho", "address of the Yaho contract")
  .addParam("zetaConnector", "address of the ZetaChain connector contract")
  .addParam("zetaToken", "address of the ZETA token contract")
  .addParam("zetaConsumer", "address of the ZetaChain consumer contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying ZetaMessageRelay...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const zetaMessageRelayFactory: ZetaMessageRelay__factory = <ZetaMessageRelay__factory>(
      await hre.ethers.getContractFactory("ZetaMessageRelay")
    )
    const constructorArguments = [
      taskArguments.yaho,
      taskArguments.chainId,
      taskArguments.zetaConnector,
      taskArguments.zetaToken,
      taskArguments.zetaConsumer,
    ] as const
    const zetaMessageRelay: ZetaMessageRelay = <ZetaMessageRelay>(
      await zetaMessageRelayFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await zetaMessageRelay.deployed()
    console.log("ZetaMessageRelay deployed to:", zetaMessageRelay.address)
    if (taskArguments.verify) await verify(hre, zetaMessageRelay)
  })
