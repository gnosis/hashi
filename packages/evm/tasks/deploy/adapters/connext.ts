import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { ConnextAdapter } from "../../../types/contracts/adapters/Connext/ConnextAdapter"
import type { ConnextHeaderReporter } from "../../../types/contracts/adapters/Connext/ConnextHeaderReporter"
import type { ConnextMessageRelay } from "../../../types/contracts/adapters/Connext/ConnextMessageRelay"
import type { ConnextAdapter__factory } from "../../../types/factories/contracts/adapters/Connext/ConnextAdapter__factory"
import type { ConnextHeaderReporter__factory } from "../../../types/factories/contracts/adapters/Connext/ConnextHeaderReporter__factory"
import type { ConnextMessageRelay__factory } from "../../../types/factories/contracts/adapters/Connext/ConnextMessageRelay__factory"
import { verify } from "../index"

task("deploy:adapter:ConnextAdapter")
  .addParam("chainId", "chain id of the reporter contract")
  .addParam("connextDomainId", "connext domain id (according to https://docs.connext.network/resources/supported-chains)")
  .addParam("reporter", "address of the reporter contract")
  .addParam("connext", "address of the Connext contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying ConnextAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const connextAdapterFactory: ConnextAdapter__factory = <ConnextAdapter__factory>(
      await hre.ethers.getContractFactory("ConnextAdapter")
    )
    const constructorArguments = [
      taskArguments.chainId,
      taskArguments.reporter,
      taskArguments.connext,
      taskArguments.connextDomainId,
    ] as const
    const connextAdapter: ConnextAdapter = <ConnextAdapter>(
      await connextAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await connextAdapter.deployed()
    console.log("ConnextAdapter deployed to:", connextAdapter.address)
    if (taskArguments.verify) await verify(hre, connextAdapter, constructorArguments)
  })

task("deploy:adapter:ConnextHeaderReporter")
  .addParam("chainId", "chain id of the adapter contract")
  .addParam("connextDomainId", "connext domain id (according to https://docs.connext.network/resources/supported-chains)")
  .addParam("headerStorage", "address of the header storage contract")
  .addParam("connext", "address of the Connext contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying ConnextHeaderReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const connextHeaderReporterFactory: ConnextHeaderReporter__factory = <ConnextHeaderReporter__factory>(
      await hre.ethers.getContractFactory("ConnextHeaderReporter")
    )
    const constructorArguments = [
      taskArguments.headerStorage,
      taskArguments.chainId,
      taskArguments.connext,
      taskArguments.connextDomainId,
    ] as const
    const connextHeaderReporter: ConnextHeaderReporter = <ConnextHeaderReporter>(
      await connextHeaderReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await connextHeaderReporter.deployed()
    console.log("ConnextHeaderReporter deployed to:", connextHeaderReporter.address)
    if (taskArguments.verify) await verify(hre, connextHeaderReporter, constructorArguments)
  })

task("deploy:adapter:ConnextMessageRelay")
  .addParam("chainId", "chain id of the adapter contract")
  .addParam("connextDomainId", "connext domain id (according to https://docs.connext.network/resources/supported-chains)")
  .addParam("yaho", "address of the Yaho contract")
  .addParam("connext", "address of the Connext contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying ConnextMessageRelay...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const connextMessageRelayFactory: ConnextMessageRelay__factory = <ConnextMessageRelay__factory>(
      await hre.ethers.getContractFactory("ConnextMessageRelay")
    )
    const constructorArguments = [
      taskArguments.yaho,
      taskArguments.chainId,
      taskArguments.connext,
      taskArguments.connextDomainId,
    ] as const
    const connextMessageRelay: ConnextMessageRelay = <ConnextMessageRelay>(
      await connextMessageRelayFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await connextMessageRelay.deployed()
    console.log("ConnextMessageRelay deployed to:", connextMessageRelay.address)
    if (taskArguments.verify) await verify(hre, connextMessageRelay, constructorArguments)
  })
