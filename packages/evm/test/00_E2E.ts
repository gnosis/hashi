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

  // deploy ShoyuBashi
  const ShoyuBashi = await ethers.getContractFactory("ShoyuBashi")
  const shoyuBashi = ShoyuBashi.deploy(wallet.address, hashi.address)

  // deploy Yaho
  const Yaho = await ethers.getContractFactory("Yaho")
  const yaho = await Yaho.deploy()

  // deploy AMB
  const AMB = await ethers.getContractFactory("MockAMB")
  const amb = await AMB.deploy()

  return {
    amb,
    wallet,
    hashi,
    shoyuBashi,
    yaho,
  }
}

describe("End-to-end tests", function () {
  describe("Execution layer", function () {
    it("Reports execution layer block hash agreed on by N adapters", async function () {
      const { amb, hashi } = await setup()

      // deploy header storage
      const HeaderStorage = await ethers.getContractFactory("HeaderStorage")
      const headerStorage = await HeaderStorage.deploy()

      // deploy AMBHeaderReporter
      const AMBHeaderReporter = await ethers.getContractFactory("AMBHeaderReporter")
      const ambHeaderReporter = await AMBHeaderReporter.deploy(amb.address, headerStorage.address)

      // deploy AMBAdapter
      const AMBAdapter = await ethers.getContractFactory("AMBAdapter")
      const ambAdapter = await AMBAdapter.deploy(amb.address, ambHeaderReporter.address, BYTES32_DOMAIN_ID)

      await ambHeaderReporter.reportHeaders([ID_ONE, ID_TWO], ambAdapter.address, 10000000)

      let expectedHash = await headerStorage.headers(ID_ONE)
      expect(
        await hashi.getHash(
          DOMAIN_ID,
          ID_ONE,
          // TODO: currently we query the AMB adapter twice. We should query two or more different adapters.
          [ambAdapter.address, ambAdapter.address],
        ),
      ).to.equal(expectedHash)
      expectedHash = await headerStorage.headers(ID_TWO)
      expect(
        await hashi.getHash(
          DOMAIN_ID,
          ID_TWO,
          // TODO: currently we query the AMB adapter twice. We should query two or more different adapters.
          [ambAdapter.address, ambAdapter.address],
        ),
      ).to.equal(expectedHash)
    })
  })
  describe("Messages", function () {
    it("Executes messages agreed on by N adapters", async function () {
      const { amb, hashi, wallet, yaho } = await setup()

      // deploy ping
      const PingPong = await ethers.getContractFactory("PingPong")
      const pingPong = await PingPong.deploy()

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

      // deploy Yaru
      const Yaru = await ethers.getContractFactory("Yaru")
      const yaru = await Yaru.deploy(hashi.address, yaho.address, DOMAIN_ID)

      // deploy Oracle Adapter
      const AMBMessageRelay = await ethers.getContractFactory("AMBMessageRelay")
      const ambMessageRelay = await AMBMessageRelay.deploy(amb.address, yaho.address)
      const AMBAdapter = await ethers.getContractFactory("AMBAdapter")
      const ambAdapter = await AMBAdapter.deploy(amb.address, ambMessageRelay.address, BYTES32_DOMAIN_ID)

      //// dispatch messages
      await yaho.dispatchMessagesToAdapters([message_1, message_2], [ambMessageRelay.address], [ambAdapter.address])

      // execute messages
      const response = await yaru.callStatic.executeMessages(
        [message_1, message_2],
        [ID_ZERO, ID_ONE],
        [wallet.address, wallet.address],
        // TODO: currently we query the AMB adapter twice. We should query two or more different adapters.
        [ambAdapter.address, ambAdapter.address],
      )
      const data = ethers.utils.defaultAbiCoder.decode(["string"], response[0])
      expect(data[0]).to.equal("pong")
    })
  })
})
