import { adapters } from "@hyperlane-xyz/core/dist/contracts/middleware/liquidity-layer"
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { ProofcastAdapter } from "../../../types/contracts/adapters/Proofcast/ProofcastAdapter"
import type { ProofcastAdapter__factory } from "../../../types/factories/contracts/adapters/Proofcast/ProofcastAdapter__factory"
import { verify } from "../index"

task("deploy:adapter:ProofcastAdapter")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying ProofcastAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const ProofcastAdapterFactory: ProofcastAdapter__factory = <ProofcastAdapter__factory>(
      await hre.ethers.getContractFactory("ProofcastAdapter")
    )
    const constructorArguments = [
      taskArguments.yaho,
      taskArguments.chainId,
      taskArguments.publicKey,
      taskArguments.attestation,
    ] as const
    const ProofcastAdapter: ProofcastAdapter = <ProofcastAdapter>(
      await ProofcastAdapterFactory.connect(signers[0]).deploy()
    )
    await ProofcastAdapter.deployed()
    console.log("ProofcastAdapter deployed to:", ProofcastAdapter.address)

    if (taskArguments.verify) await verify(hre, ProofcastAdapter, constructorArguments)
  })

task("deploy:adapter:ProofcastAdapter:initYaho")
  .addParam("adapter", "Proofcast adapter address")
  .addParam("yaho", "address of the Yaho contract")
  .addParam("chainId", "chain id of the Yaho contract")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Initializing Yaho...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const ProofcastAdapterFactory: ProofcastAdapter__factory = <ProofcastAdapter__factory>(
      await hre.ethers.getContractFactory("ProofcastAdapter")
    )
    const proofcastAdapter = ProofcastAdapterFactory.attach(taskArguments.adapter)

    const tx = await proofcastAdapter.connect(signers[0]).initYaho(taskArguments.chainId, taskArguments.yaho)
    const receipt = await tx.wait(1)

    console.log("Yaho initialized @", receipt.transactionHash)
  })

task("deploy:adapter:ProofcastAdapter:setTeeSigner")
  .addParam("adapter", "Proofcast adapter address")
  .addParam("publicKey", "event attestator public key")
  .addParam("attestation", "event attestator attestation payload")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Setting tee signer...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const ProofcastAdapterFactory: ProofcastAdapter__factory = <ProofcastAdapter__factory>(
      await hre.ethers.getContractFactory("ProofcastAdapter")
    )
    const proofcastAdapter = ProofcastAdapterFactory.attach(taskArguments.adapter)

    const tx = await proofcastAdapter
      .connect(signers[0])
      .setTeeSigner(taskArguments.publicKey, taskArguments.attestation)
    const receipt = await tx.wait(1)

    console.log("Tee signer set @", receipt.transactionHash)
  })
