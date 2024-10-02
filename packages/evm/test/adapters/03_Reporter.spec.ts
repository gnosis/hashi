import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { mine } from "@nomicfoundation/hardhat-network-helpers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address"
import { expect } from "chai"
import { Contract } from "ethers"
import { ethers, network } from "hardhat"

import { toBytes32 } from "../utils"
import { Chains } from "../utils/constants"

let reporter: Contract,
  headerStorage: Contract,
  fakeYaho: SignerWithAddress,
  fakeAdapter: SignerWithAddress,
  user: SignerWithAddress

describe("Reporter", () => {
  beforeEach(async () => {
    await network.provider.request({ method: "hardhat_reset", params: [] })

    const HeaderStorage = await ethers.getContractFactory("HeaderStorage")
    const Reporter = await ethers.getContractFactory("MockReporter")

    const signers = await ethers.getSigners()
    user = signers[0]
    fakeAdapter = signers[1]
    fakeYaho = signers[2]

    headerStorage = await HeaderStorage.deploy()
    reporter = await Reporter.deploy(headerStorage.address, fakeYaho.address)
  })

  describe("dispatchBlocks", () => {
    it("should be able to dispatch 2 blocks", async () => {
      const targetChainId = Chains.Gnosis
      const blockNumbers = [998, 999]
      await mine(1000)
      await expect(reporter.dispatchBlocks(targetChainId, fakeAdapter.address, blockNumbers))
        .to.emit(reporter, "BlockDispatched")
        .withArgs(targetChainId, fakeAdapter.address, blockNumbers[0], anyValue)
        .and.to.emit(reporter, "BlockDispatched")
        .withArgs(targetChainId, fakeAdapter.address, blockNumbers[1], anyValue)
    })
  })

  describe("dispatchMessages", () => {
    it("should not be able to call dispatchMessages if it's not yaho", async () => {
      const targetChainId = Chains.Gnosis
      const messageIds = [1, 2]
      const messageHashes = [toBytes32(1), toBytes32(2)]
      await expect(reporter.dispatchMessages(targetChainId, fakeAdapter.address, messageIds, messageHashes))
        .to.be.revertedWithCustomError(reporter, "NotYaho")
        .withArgs(user.address, fakeYaho.address)
    })

    it("should be able to dispatch 2 messages", async () => {
      const targetChainId = Chains.Gnosis
      const messageIds = [1, 2]
      const messageHashes = [toBytes32(1), toBytes32(2)]
      await expect(
        reporter.connect(fakeYaho).dispatchMessages(targetChainId, fakeAdapter.address, messageIds, messageHashes),
      )
        .to.emit(reporter, "MessageDispatched")
        .withArgs(targetChainId, fakeAdapter.address, messageIds[0], messageHashes[0])
        .and.to.emit(reporter, "MessageDispatched")
        .withArgs(targetChainId, fakeAdapter.address, messageIds[1], messageHashes[1])
    })
  })
})
