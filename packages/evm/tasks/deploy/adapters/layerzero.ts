import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { LayerZeroAdapter } from "../../../types/contracts/adapters/LayerZero/LayerZeroAdapter"
import type { LayerZeroV2Reporter } from "../../../types/contracts/adapters/LayerZero/LayerZeroV2Reporter"
import type { LayerZeroAdapter__factory } from "../../../types/factories/contracts/adapters/LayerZero/LayerZeroAdapter__factory"
import type { LayerZeroV2Reporter__factory } from "../../../types/factories/contracts/adapters/LayerZero/LayerZeroV2Reporter__factory"
import { verify } from "../index"

task("deploy:LayerZeroAdapter")
  .addParam("lzEndpoint", "address of the LayerZero endpoint contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying LayerZeroAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const layerZeroAdapterFactory: LayerZeroAdapter__factory = <LayerZeroAdapter__factory>(
      await hre.ethers.getContractFactory("LayerZeroAdapter")
    )
    const constructorArguments = [taskArguments.lzEndpoint] as const
    const layerZeroAdapter: LayerZeroAdapter = <LayerZeroAdapter>(
      await layerZeroAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await layerZeroAdapter.deployed()
    console.log("LayerZeroAdapter deployed to:", layerZeroAdapter.address)
    if (taskArguments.verify) await verify(hre, layerZeroAdapter, constructorArguments)
  })

task("deploy:LayerZeroV2Reporter")
  .addParam("headerStorage", "address of the header storage contract")
  .addParam("yaho", "address of the Yaho contract")
  .addParam("lzEndpoint", "address of the LayerZero endpoint contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying LayerZeroReporter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const layerZeroReporterFactory: LayerZeroV2Reporter__factory = <LayerZeroV2Reporter__factory>(
      await hre.ethers.getContractFactory("LayerZeroV2Reporter")
    )
    const constructorArguments = [taskArguments.headerStorage, taskArguments.yaho, taskArguments.lzEndpoint] as const
    const layerZeroReporter: LayerZeroV2Reporter = <LayerZeroV2Reporter>(
      await layerZeroReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await layerZeroReporter.deployed()
    console.log("LayerZeroReporter deployed to:", layerZeroReporter.address)
    if (taskArguments.verify) await verify(hre, layerZeroReporter, constructorArguments)
  })
