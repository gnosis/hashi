/*
Note that these E2E tests simulate cross-chain interactions but,
for the sake of convenience, use only one network as both the origin and destination chain.

*/
import { expect } from "chai"
import { ethers, network } from "hardhat"

const DOMAIN_ID = network.config.chainId
const BYTES32_DOMAIN_ID = "0x0000000000000000000000000000000000000000000000000000000000007A69"
const ADDRESS_ONE = "0x0000000000000000000000000000000000000001"

const ID_ZERO = 0
const ID_ONE = 1
const ID_TWO = 2

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

  // deploy AMB
  const AMB = await ethers.getContractFactory("MockAMB")
  const amb = await AMB.deploy()

  // deploy and initialize badAMB
  // const Mock = await ethers.getContractFactory("Mock")
  // const badMock = await Mock.deploy()
  // const badAmb = await ethers.getContractAt("IAMB", badMock.address)
  // await badMock.givenMethodReturnUint(badAmb.interface.getSighash("messageSourceChainId"), 2)
  // await badMock.givenMethodReturnAddress(badAmb.interface.getSighash("messageSender"), ADDRESS_ONE)

  // deploy Yaru
  const Yaru = await ethers.getContractFactory("Yaru")
  const yaru = await Yaru.deploy(hashi.address, yaho.address, DOMAIN_ID)

  // deploy Oracle Adapter
  const AMBMessageRelay = await ethers.getContractFactory("AMBMessageRelay")
  const ambMessageRelay = await AMBMessageRelay.deploy(amb.address, yaho.address)
  const AMBAdapter = await ethers.getContractFactory("AMBAdapter")
  const ambAdapter = await AMBAdapter.deploy(amb.address, ambMessageRelay.address, BYTES32_DOMAIN_ID)

  // deploy avatar
  const Avatar = await ethers.getContractFactory("TestAvatar")
  const avatar = await Avatar.deploy()

  // const deploy PingPong test contract
  const PingPong = await ethers.getContractFactory("PingPong")
  const pingPong = await PingPong.deploy()

  return {
    avatar,
    amb,
    ambMessageRelay,
    ambAdapter,
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
    DOMAIN_ID,
  )
  await base.avatar.setModule(module.address)
  return { ...base, Module, module, network }
}

describe("HashiModule", function () {
  describe("setUp()", function () {
    it("reverts if avatar is address zero", async () => {
      const { Module } = await setupTestWithTestAvatar()
      await expect(
        Module.deploy(
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
          DOMAIN_ID,
        ),
      ).to.be.revertedWithCustomError(Module, "AvatarCannotBeZero")
    })
    it("reverts if target is address zero", async () => {
      const Module = await ethers.getContractFactory("HashiModule")
      await expect(
        Module.deploy(ADDRESS_ONE, ADDRESS_ONE, ethers.constants.AddressZero, ADDRESS_ONE, ADDRESS_ONE, DOMAIN_ID),
      ).to.be.revertedWithCustomError(Module, "TargetCannotBeZero")
    })
    it("should emit SetUp event", async () => {
      const { wallet } = await setupTestWithTestAvatar()
      const Module = await ethers.getContractFactory("HashiModule")
      const module = await Module.deploy(ADDRESS_ONE, ADDRESS_ONE, ADDRESS_ONE, ADDRESS_ONE, ADDRESS_ONE, DOMAIN_ID)
      await module.deployed()
      await expect(module.deployTransaction)
        .to.emit(module, "HashiModuleSetup")
        .withArgs(wallet.address, ADDRESS_ONE, ADDRESS_ONE, ADDRESS_ONE)
    })
  })
  describe("setYaru()", function () {
    it("reverts if not authorized", async () => {
      const { module } = await setupTestWithTestAvatar()
      await expect(module.setYaru(module.address)).to.be.revertedWith("Ownable: caller is not the owner")
    })
    it("reverts if already set to input address", async () => {
      const { module, avatar, yaru } = await setupTestWithTestAvatar()
      const calldata = module.interface.encodeFunctionData("setYaru", [yaru.address])
      await expect(avatar.exec(module.address, 0, calldata)).to.be.revertedWithCustomError(module, "DuplicateYaru")
    })
    it("updates Yaru address", async () => {
      const { module, avatar } = await setupTestWithTestAvatar()
      const calldata = module.interface.encodeFunctionData("setYaru", [avatar.address])
      expect(await avatar.exec(module.address, 0, calldata))
    })
    it("emits YaruSet event", async () => {
      const { module, avatar } = await setupTestWithTestAvatar()
      const calldata = module.interface.encodeFunctionData("setYaru", [avatar.address])
      await expect(avatar.exec(module.address, 0, calldata))
        .to.emit(module, "YaruSet")
        .withArgs(module.address, avatar.address)
    })
  })
  describe("setChainId()", function () {
    it("reverts if not authorized", async () => {
      const { module } = await setupTestWithTestAvatar()
      await expect(module.setChainId(1)).to.be.revertedWith("Ownable: caller is not the owner")
    })
    it("reverts if already set to input id", async () => {
      const { module, avatar } = await setupTestWithTestAvatar()
      const calldata = module.interface.encodeFunctionData("setChainId", [DOMAIN_ID])
      await expect(avatar.exec(module.address, 0, calldata)).to.be.revertedWithCustomError(module, "DuplicateChainId")
    })
    it("updates chainId", async () => {
      const { module, avatar } = await setupTestWithTestAvatar()
      const calldata = module.interface.encodeFunctionData("setYaru", [avatar.address])
      expect(await avatar.exec(module.address, 0, calldata))
    })
    it("emits ChainIdSet event", async () => {
      const { module, avatar } = await setupTestWithTestAvatar()
      const calldata = module.interface.encodeFunctionData("setYaru", [avatar.address])
      await expect(avatar.exec(module.address, 0, calldata))
        .to.emit(module, "YaruSet")
        .withArgs(module.address, avatar.address)
    })
  })
  describe("setController()", function () {
    it("reverts if not authorized", async () => {
      const { module } = await setupTestWithTestAvatar()
      await expect(module.setController(ADDRESS_ONE)).to.be.revertedWith("Ownable: caller is not the owner")
    })
    it("reverts if already set to input address", async () => {
      const { module, avatar, wallet } = await setupTestWithTestAvatar()
      const calldata = module.interface.encodeFunctionData("setController", [wallet.address])
      await expect(avatar.exec(module.address, 0, calldata)).to.be.revertedWithCustomError(
        module,
        "DuplicateController",
      )
    })
    it("updates controller", async () => {
      const { module, avatar } = await setupTestWithTestAvatar()
      const calldata = module.interface.encodeFunctionData("setController", [ADDRESS_ONE])
      expect(await avatar.exec(module.address, 0, calldata))
    })
    it("emits ControllerSet event", async () => {
      const { module, avatar } = await setupTestWithTestAvatar()
      const calldata = module.interface.encodeFunctionData("setController", [ADDRESS_ONE])
      await expect(avatar.exec(module.address, 0, calldata))
        .to.emit(module, "ControllerSet")
        .withArgs(module.address, ADDRESS_ONE)
    })
  })
  describe("executeTrasnaction()", function () {
    it("reverts if hashi is unauthorized", async () => {
      const { module, wallet } = await setupTestWithTestAvatar()
      await expect(module.executeTransaction(ADDRESS_ONE, 0, "0x", 0))
        .to.be.revertedWithCustomError(module, "UnauthorizedYaru")
        .withArgs(module.address, wallet.address)
    })
    it("reverts if messageSender is unauthorized", async () => {
      const { avatar, pingPong, yaho, ambMessageRelay, ambAdapter, module, wallet, yaru } =
        await setupTestWithTestAvatar()

      // change controller to ADDRESS_ONE so it's different to sender
      const controllerCalldata = module.interface.encodeFunctionData("setController", [ADDRESS_ONE])
      expect(await avatar.exec(module.address, 0, controllerCalldata))

      const calldata = await pingPong.interface.encodeFunctionData("ping", [])
      const tx = await module.interface.encodeFunctionData("executeTransaction", [pingPong.address, 0, calldata, 0])
      const message = {
        to: module.address,
        toChainId: DOMAIN_ID,
        data: tx,
      }

      // dispatch message
      await yaho.dispatchMessagesToAdapters([message], [ambMessageRelay.address], [ambAdapter.address])
      // execute messages
      await expect(yaru.executeMessages([message], [ID_ZERO], [wallet.address], [ambAdapter.address])).to.be.reverted
    })
    it("reverts if chainId is incorrect", async () => {
      const { avatar, pingPong, yaho, ambMessageRelay, ambAdapter, module, wallet, yaru } =
        await setupTestWithTestAvatar()

      // change chainId to something random so the transaction fails
      const controllerCalldata = module.interface.encodeFunctionData("setChainId", [123])
      expect(await avatar.exec(module.address, 0, controllerCalldata))

      const calldata = await pingPong.interface.encodeFunctionData("ping", [])
      const tx = await module.interface.encodeFunctionData("executeTransaction", [pingPong.address, 0, calldata, 0])
      const message = {
        to: module.address,
        toChainId: DOMAIN_ID,
        data: tx,
      }

      // dispatch message
      await yaho.dispatchMessagesToAdapters([message], [ambMessageRelay.address], [ambAdapter.address])
      // execute messages
      await expect(yaru.executeMessages([message], [ID_ZERO], [wallet.address], [ambAdapter.address])).to.be.reverted
    })
    it("reverts if module transaction fails", async () => {
      const { pingPong, yaho, ambMessageRelay, ambAdapter, module, wallet, yaru } = await setupTestWithTestAvatar()

      // invalid function selector for pingPong
      const calldata = "0x12345678"
      const tx = await module.interface.encodeFunctionData("executeTransaction", [pingPong.address, 0, calldata, 0])
      const message = {
        to: module.address,
        toChainId: DOMAIN_ID,
        data: tx,
      }

      // dispatch message
      await yaho.dispatchMessagesToAdapters([message], [ambMessageRelay.address], [ambAdapter.address])

      await expect(yaru.executeMessages([message], [ID_ZERO], [wallet.address], [ambAdapter.address])).to.be.reverted
    })
    it("executes a transaction", async () => {
      const { pingPong, yaho, ambMessageRelay, ambAdapter, module, wallet, yaru } = await setupTestWithTestAvatar()
      const calldata = await pingPong.interface.encodeFunctionData("ping", [])
      const tx = await module.interface.encodeFunctionData("executeTransaction", [pingPong.address, 0, calldata, 0])
      const message = {
        to: module.address,
        toChainId: DOMAIN_ID,
        data: tx,
      }
      const pingCount = await pingPong.count()

      // dispatch message
      await yaho.dispatchMessagesToAdapters([message], [ambMessageRelay.address], [ambAdapter.address])
      // execute messages
      await yaru.executeMessages([message], [ID_ZERO], [wallet.address], [ambAdapter.address])

      expect(await pingPong.count()).to.equal(pingCount + 1)
    })
  })
})
