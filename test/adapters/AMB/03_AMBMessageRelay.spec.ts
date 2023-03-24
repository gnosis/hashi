import { expect } from "chai"
import { ethers, network } from "hardhat"

const DOMAIN_ID = "0x0000000000000000000000000000000000000000000000000000000000000064"

const setup = async () => {
  await network.provider.request({ method: "hardhat_reset", params: [] })
  const [wallet] = await ethers.getSigners()
  const Yaho = await ethers.getContractFactory("Yaho")
  const yaho = await Yaho.deploy()
  const AMB = await ethers.getContractFactory("MockAMB")
  const amb = await AMB.deploy()
  const AMBMessageRelay = await ethers.getContractFactory("AMBMessageRelay")
  const ambMessageRelay = await AMBMessageRelay.deploy(amb.address, yaho.address)
  const AMBAdapter = await ethers.getContractFactory("AMBAdapter")
  const ambAdapter = await AMBAdapter.deploy(amb.address, ambMessageRelay.address, DOMAIN_ID)
  const PingPong = await ethers.getContractFactory("PingPong")
  const pingPong = await PingPong.deploy()
  const message_1 = {
    to: pingPong.address,
    toChainId: 1,
    data: pingPong.interface.getSighash("ping"),
  }

  await yaho.dispatchMessages([message_1, message_1])

  return {
    amb,
    wallet,
    yaho,
    ambMessageRelay,
    ambAdapter,
    message_1,
    pingPong,
  }
}

describe("AMBMessageReporter", function () {
  describe("Deploy", function () {
    it("Successfully deploys contract", async function () {
      const { ambMessageRelay } = await setup()
      expect(await ambMessageRelay.deployed())
    })
  })

  describe("relayMessages()", function () {
    it("Relays message hashes over AMB", async function () {
      const { ambMessageRelay, ambAdapter } = await setup()
      const receipt = await ambMessageRelay.relayMessages([0, 1], ambAdapter.address)
      await expect(receipt).to.emit(ambMessageRelay, "MessageRelayed").withArgs(ambMessageRelay.address, 0)
    })
    it("Reports headers to AMB", async function () {
      const { ambMessageRelay, amb, ambAdapter, message_1, yaho, wallet } = await setup()
      const receipt = await ambMessageRelay.relayMessages([0, 1], ambAdapter.address)
      await expect(receipt).to.emit(ambMessageRelay, "MessageRelayed").withArgs(ambMessageRelay.address, 0)
      await expect(receipt).to.emit(ambMessageRelay, "MessageRelayed").withArgs(ambMessageRelay.address, 1)
      const hash0 = await yaho.calculateHash(network.config.chainId, 0, yaho.address, wallet.address, message_1)
      const hash1 = await yaho.calculateHash(network.config.chainId, 1, yaho.address, wallet.address, message_1)
      const tx = await ambAdapter.populateTransaction.storeHashes([0, 1], [hash0, hash1])
      await expect(receipt).to.emit(amb, "MessagePassed").withArgs(ambMessageRelay.address, tx.data)
    })
    it("Returns receipt", async function () {
      const { ambMessageRelay, ambAdapter } = await setup()
      const receipt = await ambMessageRelay.callStatic.relayMessages([0, 1], ambAdapter.address)
      expect(receipt).is.not.null
    })
  })
})
