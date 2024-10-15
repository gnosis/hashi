import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { DendrETHAdapter } from "../../../types/contracts/adapters/DendrETH/DendrETHAdapter"
import type { DendrETHAdapter__factory } from "../../../types/factories/contracts/adapters/DendrETH/DendrETHAdapter__factory"
import { verify } from "../index"

const MerklePatriciaAddresses = {
  10200: "0x777662E6A65411e0A425E59C496A7D1C0635A935",
  11155111: "0x1b19Dfd5e1986A0d524644F081AcB14d51159818",
  4201: "0xC82e50cc90C84DC492B4Beb6792DEeB496d52424",
}

task("deploy:adapter:DendrETHAdapter")
  .addParam("dendreth", "address of the DendrETH contract")
  .addParam("sourceChainId", "Source chain id")
  .addParam("sourceYaho", "address of the source Yaho contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()

    console.log("Deploying DendrETHAdapter...")
    const merklePatriciaAddress = MerklePatriciaAddresses[hre.network.config.chainId]
    if (!merklePatriciaAddress) {
      throw new Error("MerklePatricia Not Found")
    }
    const dendrETHAdapterFactory: DendrETHAdapter__factory = <DendrETHAdapter__factory>(
      await hre.ethers.getContractFactory("DendrETHAdapter", {
        libraries: {
          MerklePatricia: merklePatriciaAddress,
        },
      })
    )
    const constructorArguments = [
      taskArguments.dendreth,
      taskArguments.sourceChainId,
      taskArguments.sourceYaho,
    ] as const

    const dendrETHAdapter: DendrETHAdapter = <DendrETHAdapter>(
      await dendrETHAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await dendrETHAdapter.deployed()
    console.log("DendrETHAdapter deployed to:", dendrETHAdapter.address)
    if (taskArguments.verify) await verify(hre, dendrETHAdapter, constructorArguments)
  })
