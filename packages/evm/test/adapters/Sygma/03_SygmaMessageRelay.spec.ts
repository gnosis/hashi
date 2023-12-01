import { expect } from "chai"
import { ethers, network } from "hardhat"

const DOMAIN_ID = 5
const resourceID = "0x0000000000000000000000000000000000000000000000000000000000000500"

const setup = async () => {
  await network.provider.request({ method: "hardhat_reset", params: [] })
  const signers = await ethers.getSigners()
  const sender = signers[0].address
  const otherAddress = signers[2].address
  const Yaho = await ethers.getContractFactory("Yaho")
  const yaho = await Yaho.deploy()
  const SygmaBridge = await ethers.getContractFactory("MockSygmaBridge")
  const sygmaBridge = await SygmaBridge.deploy()
  const SygmaMessageRelay = await ethers.getContractFactory("SygmaMessageRelay")
  const SygmaAdapter = await ethers.getContractFactory("SygmaAdapter")
  const sygmaAdapter = await SygmaAdapter.deploy(sygmaBridge.address)
  // IBridge bridge, HeaderStorage headerStorage, bytes32 resourceID, uint8 defaultDestinationDomainID, address defaultSygmaAdapter
  const sygmaMessageRelay = await SygmaMessageRelay.deploy(
    sygmaBridge.address,
    yaho.address,
    resourceID,
    DOMAIN_ID,
    sygmaAdapter.address,
  )

  await sygmaAdapter.setReporter(sygmaMessageRelay.address, DOMAIN_ID, true)

  const PingPong = await ethers.getContractFactory("PingPong")
  const pingPong = await PingPong.deploy()
  const message_1 = {
    to: pingPong.address,
    toChainId: 1,
    data: pingPong.interface.getSighash("ping"),
  }
  await yaho.dispatchMessages([message_1, message_1])
  // await mine(10)
  return {
    sender,
    sygmaAdapter,
    otherAddress,
    yaho,
    sygmaBridge,
    sygmaMessageRelay,
    pingPong,
    message_1,
  }
}

const prepareDepositData = async (reporterAddress: string, ids: string[], hashes: string[], adapter: string) => {
  const abiCoder = ethers.utils.defaultAbiCoder
  const executionData = abiCoder
    .encode(["address", "uint256[]", "bytes32[]"], [ethers.constants.AddressZero, ids, hashes])
    .substring(66)

  const SygmaAdapter = await ethers.getContractFactory("SygmaAdapter")
  const functionSig = SygmaAdapter.interface.getSighash("storeHashes")

  //   bytes memory depositData = abi.encodePacked(
  //     uint256(0),
  //     uint16(4),
  //     IDepositAdapterTarget(address(0)).execute.selector,
  //     uint8(20),
  //     _targetDepositAdapter,
  //     uint8(20),
  //     _depositorAddress,
  //     abi.encode(depositContractCalldata)
  // );

  const depositData =
    ethers.utils.hexZeroPad("0xe7ef0", 32) +
    "0004" +
    functionSig.substring(2) +
    "14" +
    adapter.toLowerCase().substring(2) +
    "14" +
    reporterAddress.toLowerCase().substring(2) +
    executionData
  return depositData
}

describe("SygmaMessageRelay", function () {
  describe("Deploy", function () {
    it("Successfully deploys contract", async function () {
      const { sygmaBridge, yaho, sygmaAdapter, sygmaMessageRelay } = await setup()
      expect(await sygmaMessageRelay.deployed())
      expect(await sygmaMessageRelay._bridge()).to.equal(sygmaBridge.address)
      expect(await sygmaMessageRelay._yaho()).to.equal(yaho.address)
      expect(await sygmaMessageRelay._resourceID()).to.equal(resourceID)
      expect(await sygmaMessageRelay._defaultDestinationDomainID()).to.equal(DOMAIN_ID)
      expect(await sygmaMessageRelay._defaultSygmaAdapter()).to.equal(sygmaAdapter.address)
    })
  })

  describe("relayMessages()", function () {
    it("Relays messages to Sygma to default domain", async function () {
      const { sender, sygmaMessageRelay, sygmaAdapter, sygmaBridge, yaho, message_1 } = await setup()
      const hash0 = await yaho.calculateHash(network.config.chainId, 0, yaho.address, sender, message_1)
      const hash1 = await yaho.calculateHash(network.config.chainId, 1, yaho.address, sender, message_1)
      const depositData = await prepareDepositData(
        sygmaMessageRelay.address,
        ["0", "1"],
        [hash0, hash1],
        sygmaAdapter.address,
      )
      expect(await sygmaMessageRelay.callStatic.relayMessages([0, 1], sygmaAdapter.address)).to.equal(
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      )
      await expect(sygmaMessageRelay.relayMessages([0, 1], sygmaAdapter.address))
        .to.emit(sygmaMessageRelay, "MessageRelayed")
        .withArgs(sygmaMessageRelay.address, 0)
        .and.to.emit(sygmaMessageRelay, "MessageRelayed")
        .withArgs(sygmaMessageRelay.address, 1)
        .and.to.emit(sygmaBridge, "Deposit")
        // (destinationDomainID, resourceID, 1, msg.sender, depositData, feeData);
        .withArgs(DOMAIN_ID, resourceID, 1, sygmaMessageRelay.address, depositData, "0x")
    })
  })
})
