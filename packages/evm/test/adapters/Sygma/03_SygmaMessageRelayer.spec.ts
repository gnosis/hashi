import { expect } from "chai"
import { ethers, network } from "hardhat"

const DOMAIN_ID = 5
const resourceID = "0x0000000000000000000000000000000000000000000000000000000000000500"

const setup = async () => {
  await network.provider.request({ method: "hardhat_reset", params: [] })
  const signers = await ethers.getSigners()
  const sender = signers[0].address
  const adapter = signers[1].address
  const otherAddress = signers[2].address
  const Yaho = await ethers.getContractFactory("Yaho")
  const yaho = await Yaho.deploy()
  const SygmaBridge = await ethers.getContractFactory("MockSygmaBridge")
  const sygmaBridge = await SygmaBridge.deploy()
  const SygmaMessageRelayer = await ethers.getContractFactory("SygmaMessageRelayer")
  // IBridge bridge, HeaderStorage headerStorage, bytes32 resourceID, uint8 defaultDestinationDomainID, address defaultSygmaAdapter
  const sygmaMessageRelayer = await SygmaMessageRelayer.deploy(
    sygmaBridge.address,
    yaho.address,
    resourceID,
    DOMAIN_ID,
    adapter,
  )
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
    adapter,
    otherAddress,
    yaho,
    sygmaBridge,
    sygmaMessageRelayer,
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
    ethers.utils.hexZeroPad("0x0", 32) +
    "0004" +
    functionSig.substring(2) +
    "14" +
    adapter.toLowerCase().substring(2) +
    "14" +
    reporterAddress.toLowerCase().substring(2) +
    executionData
  return depositData
}

describe("SygmaMessageRelayer", function () {
  describe("Deploy", function () {
    it("Successfully deploys contract", async function () {
      const { sygmaBridge, yaho, adapter, sygmaMessageRelayer } = await setup()
      expect(await sygmaMessageRelayer.deployed())
      expect(await sygmaMessageRelayer._bridge()).to.equal(sygmaBridge.address)
      expect(await sygmaMessageRelayer._yaho()).to.equal(yaho.address)
      expect(await sygmaMessageRelayer._resourceID()).to.equal(resourceID)
      expect(await sygmaMessageRelayer._defaultDestinationDomainID()).to.equal(DOMAIN_ID)
      expect(await sygmaMessageRelayer._defaultSygmaAdapter()).to.equal(adapter)
    })
  })

  describe("relayMessages()", function () {
    it("Relays messages to Sygma to default domain", async function () {
      const { sender, sygmaMessageRelayer, adapter, sygmaBridge, yaho, message_1 } = await setup()
      const hash0 = await yaho.calculateHash(network.config.chainId, 0, yaho.address, sender, message_1)
      const hash1 = await yaho.calculateHash(network.config.chainId, 1, yaho.address, sender, message_1)
      const depositData = await prepareDepositData(sygmaMessageRelayer.address, ["0", "1"], [hash0, hash1], adapter)
      expect(await sygmaMessageRelayer.callStatic.relayMessages([0, 1], adapter)).to.equal(
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      )
      await expect(sygmaMessageRelayer.relayMessages([0, 1], adapter))
        .to.emit(sygmaMessageRelayer, "MessageRelayed")
        .withArgs(sygmaMessageRelayer.address, 0)
        .and.to.emit(sygmaMessageRelayer, "MessageRelayed")
        .withArgs(sygmaMessageRelayer.address, 1)
        .and.to.emit(sygmaBridge, "Deposit")
        // (destinationDomainID, resourceID, 1, msg.sender, depositData, feeData);
        .withArgs(DOMAIN_ID, resourceID, 1, sygmaMessageRelayer.address, depositData, "0x")
    })
  })
})
