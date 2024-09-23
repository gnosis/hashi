import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { LayerZeroAdapter } from "../../../types/contracts/adapters/LayerZero/LayerZeroAdapter"
import type { LayerZeroReporter } from "../../../types/contracts/adapters/LayerZero/LayerZeroReporter"
import type { LayerZeroAdapter__factory } from "../../../types/factories/contracts/adapters/LayerZero/LayerZeroAdapter__factory"
import type { LayerZeroReporter__factory } from "../../../types/factories/contracts/adapters/LayerZero/LayerZeroReporter__factory"
import { verify } from "../index"

task("deploy:LayerZeroAdapter")
  .addParam("lzendpoint", "address of the LayerZero endpoint contract")
  .addParam("delegate", "address of delegate")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying LayerZeroAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const layerZeroAdapterFactory: LayerZeroAdapter__factory = <LayerZeroAdapter__factory>(
      await hre.ethers.getContractFactory("LayerZeroAdapter")
    )
    const constructorArguments = [taskArguments.lzendpoint, taskArguments.delegate] as const
    const layerZeroAdapter: LayerZeroAdapter = <LayerZeroAdapter>(
      await layerZeroAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await layerZeroAdapter.deployed()
    console.log("LayerZeroAdapter deployed to:", layerZeroAdapter.address)
    if (taskArguments.verify) await verify(hre, layerZeroAdapter, constructorArguments)
  })

task("deploy:LayerZeroReporter")
  .addParam("headerstorage", "address of the header storage contract")
  .addParam("yaho", "address of the Yaho contract")
  .addParam("lzendpoint", "address of the LayerZero endpoint contract")
  .addParam("delegate", "address of delegate")
  .addParam("refundaddress", "refund address")
  .addParam("defaultfee", "default fee")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying LayerZeroReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const layerZeroReporterFactory: LayerZeroReporter__factory = <LayerZeroReporter__factory>(
      await hre.ethers.getContractFactory("LayerZeroReporter")
    )
    const constructorArguments = [
      taskArguments.headerstorage,
      taskArguments.yaho,
      taskArguments.lzendpoint,
      taskArguments.delegate,
      taskArguments.refundaddress,
      taskArguments.defaultfee,
    ] as const
    const layerZeroReporter: LayerZeroReporter = <LayerZeroReporter>(
      await layerZeroReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await layerZeroReporter.deployed()
    console.log("LayerZeroReporter deployed to:", layerZeroReporter.address)
    if (taskArguments.verify) await verify(hre, layerZeroReporter, constructorArguments)
  })
