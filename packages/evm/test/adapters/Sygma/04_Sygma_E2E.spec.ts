/*
Note that these E2E tests simulate cross-chain interactions but,
for the sake of convenience, use only one network as both the origin and destination chain.

*/
import { expect } from "chai"
import { ethers, network } from "hardhat"

// Source chain ID
const CHAIN_ID = network.config.chainId
// Destination domain ID
const DOMAIN_ID = 5
const resourceID = "0x0000000000000000000000000000000000000000000000000000000000000500"

const ID_ZERO = 0

const baseSetup = async () => {
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

  // deploy Mock Sygma Bridge
  const SygmaBridge = await ethers.getContractFactory("MockSygmaBridge")
  const sygmaBridge = await SygmaBridge.deploy()

  // deploy Sygma Adapter
  const SygmaAdapter = await ethers.getContractFactory("SygmaAdapter")
  const sygmaAdapter = await SygmaAdapter.deploy(sygmaBridge.address)

  // deploy Sygma Message Relayer
  const SygmaMessageRelayer = await ethers.getContractFactory("SygmaMessageRelayer")
  const sygmaMessageRelayer = await SygmaMessageRelayer.deploy(
    sygmaBridge.address,
    yaho.address,
    resourceID,
    DOMAIN_ID,
    sygmaAdapter.address,
  )

  await sygmaAdapter.setReporter(sygmaMessageRelayer.address, CHAIN_ID, true)

  // deploy Yaru
  const Yaru = await ethers.getContractFactory("Yaru")
  const yaru = await Yaru.deploy(hashi.address, yaho.address, CHAIN_ID)

  // deploy avatar
  const Avatar = await ethers.getContractFactory("TestAvatar")
  const avatar = await Avatar.deploy()

  // const deploy PingPong test contract
  const PingPong = await ethers.getContractFactory("PingPong")
  const pingPong = await PingPong.deploy()

  return {
    avatar,
    sygmaBridge,
    sygmaMessageRelayer,
    sygmaAdapter,
    wallet,
    hashi,
    shoyuBashi,
    yaho,
    yaru,
    pingPong,
  }
}

const setupTestWithTestAvatar = async () => {
  const base = await baseSetup()
  const Module = await ethers.getContractFactory("HashiModule")
  const provider = await ethers.getDefaultProvider()
  const network = await provider.getNetwork()
  const module = await Module.deploy(
    base.avatar.address,
    base.avatar.address,
    base.avatar.address,
    base.yaru.address,
    base.wallet.address,
    CHAIN_ID,
  )
  await base.avatar.setModule(module.address)
  return { ...base, Module, module, network }
}

describe("SygmaMessageRelayer End-to-End", function () {
  describe("executeTransaction()", function () {
    it("executes a transaction", async () => {
      const { pingPong, yaho, sygmaMessageRelayer, sygmaAdapter, module, wallet, yaru } =
        await setupTestWithTestAvatar()
      const calldata = await pingPong.interface.encodeFunctionData("ping", [])
      const tx = await module.interface.encodeFunctionData("executeTransaction", [pingPong.address, 0, calldata, 0])
      const message = {
        to: module.address,
        toChainId: DOMAIN_ID,
        data: tx,
      }
      const pingCount = await pingPong.count()

      // dispatch message
      await yaho.dispatchMessagesToAdapters([message], [sygmaMessageRelayer.address], [sygmaAdapter.address])
      // execute messages
      await yaru.executeMessages([message], [ID_ZERO], [wallet.address], [sygmaAdapter.address])

      expect(await pingPong.count()).to.equal(pingCount + 1)
    })
  })
})
