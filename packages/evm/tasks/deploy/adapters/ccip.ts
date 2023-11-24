import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { CCIPAdapter } from "../../../types/contracts/adapters/Chainlink/CCIPAdapter"
import type { CCIPHeaderReporter } from "../../../types/contracts/adapters/Chainlink/CCIPHeaderReporter"
import type { CCIPMessageRelay } from "../../../types/contracts/adapters/Chainlink/CCIPMessageRelay"
import type { CCIPAdapter__factory } from "../../../types/factories/contracts/adapters/Chainlink/CCIPAdapter__factory"
import type { CCIPHeaderReporter__factory } from "../../../types/factories/contracts/adapters/Chainlink/CCIPHeaderReporter__factory"
import type { CCIPMessageRelay__factory } from "../../../types/factories/contracts/adapters/Chainlink/CCIPMessageRelay__factory"
import { verify } from "../index"

task("deploy:adapter:CCIPAdapter")
  .addParam("chainId", "chain id of the reporter contract")
  .addParam("reporter", "address of the reporter contract")
  .addParam("router", "address of the CCIP router contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying CCIPAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const ccipAdapterFactory: CCIPAdapter__factory = <CCIPAdapter__factory>(
      await hre.ethers.getContractFactory("CCIPAdapter")
    )
    const constructorArguments = [
      taskArguments.chainId,
      taskArguments.reporter,
      taskArguments.router,
      taskArguments.chainId,
    ] as const
    const ccipAdapter: CCIPAdapter = <CCIPAdapter>(
      await ccipAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await ccipAdapter.deployed()
    console.log("CCIPAdapter deployed to:", ccipAdapter.address)
    if (taskArguments.verify) await verify(hre, ccipAdapter)
  })

task("deploy:adapter:CCIPHeaderReporter")
  .addParam("chainId", "chain id of the adapter contract")
  .addParam("headerStorage", "address of the header storage contract")
  .addParam("router", "address of the CCIP router contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying CCIPHeaderReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const ccipHeaderReporterFactory: CCIPHeaderReporter__factory = <CCIPHeaderReporter__factory>(
      await hre.ethers.getContractFactory("CCIPHeaderReporter")
    )
    const constructorArguments = [
      taskArguments.headerStorage,
      taskArguments.chainId,
      taskArguments.router,
      taskArguments.chainId,
    ] as const
    const ccipHeaderReporter: CCIPHeaderReporter = <CCIPHeaderReporter>(
      await ccipHeaderReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await ccipHeaderReporter.deployed()
    console.log("CCIPHeaderReporter deployed to:", ccipHeaderReporter.address)
    if (taskArguments.verify) await verify(hre, ccipHeaderReporter)
  })

task("deploy:adapter:CCIPMessageRelay")
  .addParam("chainId", "chain id of the adapter contract")
  .addParam("yaho", "address of the Yaho contract")
  .addParam("router", "address of the CCIP router contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying CCIPMessageRelay...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const ccipMessageRelayFactory: CCIPMessageRelay__factory = <CCIPMessageRelay__factory>(
      await hre.ethers.getContractFactory("CCIPMessageRelay")
    )
    const constructorArguments = [
      taskArguments.yaho,
      taskArguments.chainId,
      taskArguments.router,
      taskArguments.chainId,
    ] as const
    const ccipMessageRelay: CCIPMessageRelay = <CCIPMessageRelay>(
      await ccipMessageRelayFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await ccipMessageRelay.deployed()
    console.log("CCIPMessageRelay deployed to:", ccipMessageRelay.address)
    if (taskArguments.verify) await verify(hre, ccipMessageRelay)
  })
