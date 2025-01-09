import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { SP1HeliosAdapter } from "../../../types/contracts/adapters/SP1Helios/SP1HeliosAdapter"
import type { SP1HeliosAdapter__factory } from "../../../types/factories/contracts/adapters/SP1Helios/SP1HeliosAdapter__factory"
import { verify } from "../index"

const MerklePatriciaAddresses = {
  10200: "0x777662E6A65411e0A425E59C496A7D1C0635A935",
  100: "0xff07C59F7D882D1799e1CABd1D17faaDE7694fe0",
  11155111: "0x1b19Dfd5e1986A0d524644F081AcB14d51159818",
  4201: "0xC82e50cc90C84DC492B4Beb6792DEeB496d52424",
  42: "0x10Da7e0e9eBc8BFE0021698F557F418889b9b4D2",
}

task("deploy:SP1HeliosAdapter")
  .addParam("sp1helios")
  .addParam("sourceChainId")
  .addParam("sourceYaho")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying SP1HeliosAdapter...")
    const merklePatriciaAddress = MerklePatriciaAddresses[hre.network.config.chainId]
    if (!merklePatriciaAddress) {
      throw new Error("MerklePatricia Not Found")
    }
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const SP1HeliosAdapterFactory: SP1HeliosAdapter__factory = <SP1HeliosAdapter__factory>(
      await hre.ethers.getContractFactory("SP1HeliosAdapter", {
        libraries: {
          MerklePatricia: merklePatriciaAddress,
        },
      })
    )
    const constructorArguments = [
      taskArguments.sp1helios,
      taskArguments.sourceChainId,
      taskArguments.sourceYaho,
    ] as const
    const SP1HeliosAdapter: SP1HeliosAdapter = <SP1HeliosAdapter>(
      await SP1HeliosAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await SP1HeliosAdapter.deployed()
    console.log("SP1HeliosAdapter deployed to:", SP1HeliosAdapter.address)
    if (taskArguments.verify) await verify(hre, SP1HeliosAdapter, constructorArguments)
  })
