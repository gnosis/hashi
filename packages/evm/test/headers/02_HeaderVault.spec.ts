import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address"
import { expect } from "chai"
import { Contract } from "ethers"
import { RLP } from "ethers/lib/utils"
import { ethers } from "hardhat"

import { Chains, ZERO_ADDRESS } from "../constants"
import { blockRLP, getBlock, mine, toBytes32 } from "../utils"

const abiCoder = new ethers.utils.AbiCoder()

let headerVault: Contract,
  fakeYaru: SignerWithAddress,
  reportedBlockNumbers: Array<number>,
  unreportedBlockNumbers: Array<number>,
  blocks: Array<any>,
  reportedBlockHashes: Array<string>

describe("HeaderVault", function () {
  this.beforeEach(async function () {
    const HeaderVault = await ethers.getContractFactory("HeaderVault")

    const signers = await ethers.getSigners()
    fakeYaru = await signers[1]

    headerVault = await HeaderVault.deploy()
    await headerVault.initializeYaru(fakeYaru.address)

    await mine(120)
    reportedBlockNumbers = [100, 110]
    unreportedBlockNumbers = [109, 108, 107]
    blocks = await Promise.all(
      [...reportedBlockNumbers, ...unreportedBlockNumbers].map((_blockNumber) => getBlock(_blockNumber)),
    )
    reportedBlockHashes = [blocks[0].hash, blocks[1].hash]

    await Promise.all
    reportedBlockNumbers.map((_blockNumber, _index) =>
      headerVault
        .connect(fakeYaru)
        .onMessage(
          abiCoder.encode(["uint256", "bytes32"], [_blockNumber, reportedBlockHashes[_index]]),
          toBytes32(1),
          Chains.Hardhat,
          ZERO_ADDRESS,
        ),
    )
  })

  describe("onMessage()", function () {
    it("stores a block", async function () {
      const blockNumber = await ethers.provider.getBlockNumber()
      const block = await ethers.provider.getBlock(blockNumber)

      const data = abiCoder.encode(["uint256", "bytes32"], [blockNumber, block.hash])
      await expect(headerVault.connect(fakeYaru).onMessage(data, toBytes32(1), Chains.Hardhat, ZERO_ADDRESS))
        .to.emit(headerVault, "NewBlock")
        .withArgs(Chains.Hardhat, blockNumber, block.hash)
    })
  })

  describe("proveAncestralBlockHashes()", function () {
    it("Adds ancestral block hashesven blocks", async function () {
      const blockHeaders = blocks.map((_block) => blockRLP(_block))
      const tx = headerVault.proveAncestralBlockHashes(Chains.Hardhat, blockHeaders)
      for (const block of blocks) {
        await expect(tx)
          .to.emit(headerVault, "NewBlock")
          .withArgs(Chains.Hardhat, block._blockNumber - 1, block.parentHash)
      }
    })

    it("Reverts if given unknown blocks", async function () {
      const unreportedBlockNumber = unreportedBlockNumbers[0]
      const unreportedBlock = blocks.find((_block) => _block._blockNumber === unreportedBlockNumber)
      const blockHeaders = [blockRLP(unreportedBlock)]
      await expect(headerVault.proveAncestralBlockHashes(Chains.Hardhat, blockHeaders))
        .to.revertedWithCustomError(headerVault, "ConflictingBlockHeader")
        .withArgs(unreportedBlockNumber, unreportedBlock.hash, toBytes32(0))
    })

    it("Reverts if block header is invalid RLP encoding", async function () {
      const invalidRLP = ["0xa0000000"]
      await expect(headerVault.proveAncestralBlockHashes(Chains.Hardhat, invalidRLP)).to.revertedWithCustomError(
        headerVault,
        "InvalidBlockHeaderRLP",
      )
    })

    it("Reverts if block proof doesn't match valid block header lengths", async function () {
      const blockHeaderContents = RLP.decode(blockRLP(blocks[0]))
      const blockHeaderTooShortContents = blockHeaderContents.slice(0, 14)
      const blockHeaderTooShort = RLP.encode(blockHeaderTooShortContents)

      // Block header RLP contains too few elements
      await expect(headerVault.proveAncestralBlockHashes(Chains.Hardhat, [blockHeaderTooShort]))
        .to.revertedWithCustomError(headerVault, "InvalidBlockHeaderLength")
        .withArgs(blockHeaderTooShortContents.length)

      const blockHeaderTooLongContents = blockHeaderContents.concat([headerVault.address, headerVault.address])
      const blockHeaderTooLong = RLP.encode(blockHeaderTooLongContents)

      // Block header RLP contains too many elements
      await expect(headerVault.proveAncestralBlockHashes(Chains.Hardhat, [blockHeaderTooLong]))
        .to.revertedWithCustomError(headerVault, "InvalidBlockHeaderLength")
        .withArgs(blockHeaderTooLongContents.length)
    })
  })
})
