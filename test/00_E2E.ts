/*
Note that these E2E tests simulate cross-chain interactions but,
for the sake of convenience, use only one network as both the origin and destination chain.

*/
import { expect } from "chai"
import { ethers, network } from "hardhat"

const DOMAIN_ID = network.config.chainId
const BYTES32_DOMAIN_ID = "0x0000000000000000000000000000000000000000000000000000000000007A69"

const ID_ZERO = 0
const ID_ONE = 1
const ID_TWO = 2

const setup = async () => {
  const [wallet] = await ethers.getSigners()

  // deploy hashi
  const Hashi = await ethers.getContractFactory("Hashi")
  const hashi = await Hashi.deploy()

  // deploy GiriGiriBashi
  const GiriGiriBashi = await ethers.getContractFactory("GiriGiriBashi")
  const giriGiriBashi = GiriGiriBashi.deploy(wallet.address, hashi.address)

  // deploy Yaho
  const Yaho = await ethers.getContractFactory("Yaho")
  const yaho = await Yaho.deploy()

  // deploy AMB
  const AMB = await ethers.getContractFactory("MockAMB")
  const amb = await AMB.deploy()

  // deploy Yaru
  const Yaru = await ethers.getContractFactory("Yaru")
  const yaru = await Yaru.deploy(hashi.address, yaho.address)

  // deploy ping
  const PingPong = await ethers.getContractFactory("PingPong")
  const pingPong = await PingPong.deploy()

  // deploy Oracle Adapters
  // const OracleAdapter = await ethers.getContractFactory("MockOracleAdapter")
  // const oracleAdapter = await OracleAdapter.deploy()

  const message_1 = {
    to: pingPong.address,
    toChainId: DOMAIN_ID,
    data: pingPong.interface.getSighash("ping"),
  }
  const message_2 = {
    to: "0x0000000000000000000000000000000000000002",
    toChainId: DOMAIN_ID,
    data: 0x02,
  }

  const hash_one = await yaho.calculateHash(DOMAIN_ID, ID_ZERO, yaho.address, wallet.address, message_1)
  const hash_two = await yaho.calculateHash(DOMAIN_ID, ID_ONE, yaho.address, wallet.address, message_2)
  const failMessage = {
    to: hashi.address,
    toChainId: 1,
    data: 0x1111111111,
  }
  const hash_fail = await yaho.calculateHash(DOMAIN_ID, ID_TWO, yaho.address, wallet.address, failMessage)
  // await oracleAdapter.setHashes(DOMAIN_ID, [ID_ZERO, ID_ONE, ID_TWO], [hash_one, hash_two, hash_fail])

  return {
    amb,
    wallet,
    hashi,
    giriGiriBashi,
    yaru,
    // oracleAdapter,
    yaho,
    hash_one,
    hash_two,
    failMessage,
    hash_fail,
    pingPong,
    message_1,
    message_2,
  }
}

describe("End-to-end tests", function () {
  describe("Consensus Layer", function () {
    it("Reports consensus layer BeaconBlockHeader")
  })
  describe("Execution layer", function () {
    it("Reports execution layer block hash agreed on by M/N adapters")
  })
  describe("Messages", function () {
    it("Executes messages agreed on by N adapters", async function () {
      const { amb, yaru, wallet, message_1, message_2, yaho } = await setup()

      // deply Oracle Adapter
      const AMBMessageRelay = await ethers.getContractFactory("AMBMessageRelay")
      const ambMessageRelay = await AMBMessageRelay.deploy(amb.address, yaho.address)
      const AMBAdapter = await ethers.getContractFactory("AMBAdapter")
      const ambAdapter = await AMBAdapter.deploy(amb.address, ambMessageRelay.address, BYTES32_DOMAIN_ID)

      // dispatch messages
      await yaho.dispatchMessagesToAdapters([message_1, message_2], [ambMessageRelay.address], [ambAdapter.address])

      // execute messages
      const response = await yaru.callStatic.executeMessagesFromOracles(
        [DOMAIN_ID, DOMAIN_ID],
        [message_1, message_2],
        [ID_ZERO, ID_ONE],
        [wallet.address, wallet.address],
        [ambAdapter.address],
      )
      const data = await ethers.utils.defaultAbiCoder.decode(["string"], response[0])
      expect(data[0]).to.equal("pong")
    })
  })
})
