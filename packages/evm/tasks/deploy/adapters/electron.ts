import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import type { MerklePatricia } from "../../../types/@polytope-labs/solidity-merkle-trees/src/MerklePatricia"
import type { EthereumTrieDB } from "../../../types/@polytope-labs/solidity-merkle-trees/src/trie/ethereum/EthereumTrieDB"
import type { ElectronAdapter } from "../../../types/contracts/adapters/Electron/ElectronAdapter"
import type { MerklePatricia__factory } from "../../../types/factories/@polytope-labs/solidity-merkle-trees/src/MerklePatricia__factory"
import type { EthereumTrieDB__factory } from "../../../types/factories/@polytope-labs/solidity-merkle-trees/src/trie/ethereum/EthereumTrieDB__factory"
import type { ElectronAdapter__factory } from "../../../types/factories/contracts/adapters/Electron/ElectronAdapter__factory"
import { verify } from "../index"

// deploy on destination chain
task("deploy:adapter:ElectronAdapter")
  .addParam("lightClientAddress", "Address of the LightClient contract on the destination chain")
  .addParam("eventSourceAddress", "Address of the HeaderStorage contract on the source chain")
  .addParam("chainIdSource", "Source Chain ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying ElectronAdapter...")
    const signers: SignerWithAddress[] = await hre.ethers.getSigners()

    // deploy required libraries first
    // EthereumTrieDB
    const ethereumTrieDBFactory: EthereumTrieDB__factory = <EthereumTrieDB__factory>(
      await hre.ethers.getContractFactory("EthereumTrieDB")
    )
    const ethereumTrieDB: EthereumTrieDB = <EthereumTrieDB>await ethereumTrieDBFactory.connect(signers[0]).deploy()
    await ethereumTrieDB.deployed()

    // MerklePatricia
    const merklePatriciaFactory: MerklePatricia__factory = <MerklePatricia__factory>await hre.ethers.getContractFactory(
      "MerklePatricia",
      {
        libraries: {
          EthereumTrieDB: ethereumTrieDB.address,
        },
      },
    )
    const merklePatricia: MerklePatricia = <MerklePatricia>await merklePatriciaFactory.connect(signers[0]).deploy()
    await merklePatricia.deployed()

    // ElectronAdapter
    const electronAdapterFactory: ElectronAdapter__factory = <ElectronAdapter__factory>(
      await hre.ethers.getContractFactory("ElectronAdapter", {
        libraries: {
          MerklePatricia: merklePatricia.address,
        },
      })
    )
    const constructorArguments = [
      taskArguments.lightClientAddress,
      taskArguments.eventSourceAddress,
      taskArguments.chainIdSource,
    ] as const
    const electronAdapter: ElectronAdapter = <ElectronAdapter>(
      await electronAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await electronAdapter.deployed()
    console.log("ElectronAdapter deployed to:", electronAdapter.address)
    if (taskArguments.verify) await verify(hre, electronAdapter, constructorArguments)
  })
