import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { PNetworkAdapter } from "../../../types/contracts/adapters/pnetwork/PNetworkAdapter"
import type { PNetworkHeaderReporter } from "../../../types/contracts/adapters/pnetwork/PNetworkHeaderReporter"
import type { PNetworkMessageRelay } from "../../../types/contracts/adapters/pnetwork/PNetworkMessageRelayer.sol"
import type { PNetworkAdapter__factory } from "../../../types/factories/contracts/adapters/pnetwork/PNetworkAdapter__factory"
import type { PNetworkHeaderReporter__factory } from "../../../types/factories/contracts/adapters/pnetwork/PNetworkHeaderReporter__factory"
import type { PNetworkMessageRelay__factory } from "../../../types/factories/contracts/adapters/pnetwork/PNetworkMessageRelayer.sol"
import { verify } from "../index"

task("deploy:adapter:PNetworkHeaderReporter")
  .addParam("yaho", "address of the Yaho contract")
  .addParam("chainId", "chain id of the adapter contract")
  .addParam("vault", "address of the vault contract (address 0 when deploying on non-native chain)")
  .addParam("token", "address of the token used to transfer data")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying PNetworkHeaderReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const pNetworkHeaderReporterFactory: PNetworkHeaderReporter__factory = <PNetworkHeaderReporter__factory>(
      await hre.ethers.getContractFactory("PNetworkHeaderReporter")
    )
    const constructorArguments = [
      taskArguments.yaho,
      taskArguments.chainId,
      taskArguments.vault,
      taskArguments.token,
    ] as const
    const pNetworkHeaderReporter: PNetworkHeaderReporter = <PNetworkHeaderReporter>(
      await pNetworkHeaderReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await pNetworkHeaderReporter.deployed()
    console.log("PNetworkHeaderReporter deployed to:", pNetworkHeaderReporter.address)

    if (taskArguments.verify) await verify(hre, pNetworkHeaderReporter, constructorArguments)
  })

task("deploy:adapter:PNetworkMessageRelay")
  .addParam("yaho", "address of the Yaho contract")
  .addParam("chainId", "chain id of the adapter contract")
  .addParam("vault", "address of the vault contract (address 0 when deploying on non-native chain)")
  .addParam("token", "address of the token used to transfer data")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying PNetworkMessageRelay...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const pNetworkAdapterFactory: PNetworkMessageRelay__factory = <PNetworkMessageRelay__factory>(
      await hre.ethers.getContractFactory("PNetworkMessageRelay")
    )
    const constructorArguments = [
      taskArguments.yaho,
      taskArguments.chainId,
      taskArguments.vault,
      taskArguments.token,
    ] as const
    const pNetworkMessageRelay: PNetworkMessageRelay = <PNetworkMessageRelay>(
      await pNetworkAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await pNetworkMessageRelay.deployed()
    console.log("PNetworkMessageRelay deployed to:", pNetworkMessageRelay.address)

    if (taskArguments.verify) await verify(hre, pNetworkMessageRelay, constructorArguments)
  })

task("deploy:adapter:PNetworkAdapter")
  .addParam("chainId", "chain id of the reporter contract")
  .addParam("reporter", "address of the reporter contract")
  .addParam("vault", "address of the vault contract (address 0 when deploying on non-native chain)")
  .addParam("token", "address of the token used to transfer data")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying PNetworkAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const pNetworkAdapterFactory: PNetworkAdapter__factory = <PNetworkAdapter__factory>(
      await hre.ethers.getContractFactory("TelepathyAdapter")
    )
    const constructorArguments = [
      taskArguments.chainId,
      taskArguments.reporter,
      taskArguments.vault,
      taskArguments.token,
    ] as const
    const pNetworkAdapter: PNetworkAdapter = <PNetworkAdapter>(
      await pNetworkAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await pNetworkAdapter.deployed()
    console.log("PNetworkAdapter deployed to:", pNetworkAdapter.address)

    if (taskArguments.verify) await verify(hre, pNetworkAdapter, constructorArguments)
  })
