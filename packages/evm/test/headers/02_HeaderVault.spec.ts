import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address"
import { expect } from "chai"
import { Contract } from "ethers"
import { ethers } from "hardhat"

import { Chains, ZERO_ADDRESS } from "../constants"
import { toBytes32 } from "../utils"

const abiCoder = new ethers.utils.AbiCoder()

let headerVault: Contract, fakeYaru: SignerWithAddress

describe("HeaderVault", function () {
  this.beforeEach(async function () {
    const HeaderVault = await ethers.getContractFactory("HeaderVault")

    const signers = await ethers.getSigners()
    fakeYaru = await signers[1]

    headerVault = await HeaderVault.deploy()
    await headerVault.initializeYaru(fakeYaru.address)
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
})
