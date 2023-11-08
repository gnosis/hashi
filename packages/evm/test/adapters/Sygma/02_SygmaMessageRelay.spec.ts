import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { Contract } from "ethers"
import { ethers, network } from "hardhat"

import { Chains } from "../../constants"
import Message from "../../utils/Message"

const resourceID = "0x0000000000000000000000000000000000000000000000000000000000000100"

let headerStorage: Contract,
  headerReporter: Contract,
  yaho: Contract,
  sygmaBridge: Contract,
  sygmaAdapter: Contract,
  sygmaMessageRelayer: Contract,
  pingPong: Contract,
  fakeYaho: SignerWithAddress

const prepareDepositData = async (reporterAddress: string, ids: string[], hashes: string[], adapter: string) => {
  const abiCoder = ethers.utils.defaultAbiCoder
  const executionData = abiCoder
    .encode(["address", "bytes32[]", "bytes32[]"], [ethers.constants.AddressZero, ids, hashes])
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

describe("SygmaMessageRelay", function () {
  this.beforeEach(async function () {
    await network.provider.request({ method: "hardhat_reset", params: [] })

    const HeaderStorage = await ethers.getContractFactory("HeaderStorage")
    const HeaderReporter = await ethers.getContractFactory("HeaderReporter")
    const Yaho = await ethers.getContractFactory("Yaho")
    const SygmaBridge = await ethers.getContractFactory("MockSygmaBridge")
    const SygmaMessageRelay = await ethers.getContractFactory("SygmaMessageRelay")
    const SygmaAdapter = await ethers.getContractFactory("SygmaAdapter")
    const PingPong = await ethers.getContractFactory("PingPong")

    const signers = await ethers.getSigners()
    fakeYaho = signers[1]

    headerStorage = await HeaderStorage.deploy()
    headerReporter = await HeaderReporter.deploy(headerStorage.address)
    yaho = await Yaho.deploy(headerReporter.address)
    sygmaBridge = await SygmaBridge.deploy()
    sygmaAdapter = await SygmaAdapter.deploy(sygmaBridge.address)
    sygmaMessageRelayer = await SygmaMessageRelay.deploy(
      sygmaBridge.address,
      fakeYaho.address,
      resourceID,
      sygmaAdapter.address,
    )
    pingPong = await PingPong.deploy()

    await sygmaAdapter.setReporter(sygmaMessageRelayer.address, Chains.Goerli, true)
  })

  describe("Deploy", function () {
    it("Successfully deploys contract", async function () {
      expect(await sygmaMessageRelayer.deployed())
      expect(await sygmaMessageRelayer._bridge()).to.equal(sygmaBridge.address)
      expect(await sygmaMessageRelayer.yaho()).to.equal(fakeYaho.address)
      expect(await sygmaMessageRelayer._resourceID()).to.equal(resourceID)
      expect(await sygmaMessageRelayer._defaultSygmaAdapter()).to.equal(sygmaAdapter.address)
    })
  })

  describe("relayMessages()", function () {
    it("Relays messages to Sygma to default domain", async function () {
      const tx = await yaho["dispatchMessages(uint256[],address[],bytes[])"](
        [Chains.Mainnet],
        [pingPong.address],
        [pingPong.interface.getSighash("ping")],
      )
      const [message1] = Message.fromReceipt(await tx.wait(1))
      const hash1 = await yaho.hashes(message1.id)

      expect(
        await sygmaMessageRelayer
          .connect(fakeYaho)
          .callStatic.relayMessages(
            [Chains.Mainnet],
            [message1.id],
            [await yaho.hashes(message1.id)],
            sygmaAdapter.address,
          ),
      ).to.equal("0x1e7c5c1c118b439a090ebf565465179476e94bae5ba6a5ae0f146ec3866c8795")

      const depositData = await prepareDepositData(
        sygmaMessageRelayer.address,
        [message1.id],
        [hash1],
        sygmaAdapter.address,
      )
      await expect(
        sygmaMessageRelayer
          .connect(fakeYaho)
          .relayMessages([Chains.Mainnet], [message1.id], [await yaho.hashes(message1.id)], sygmaAdapter.address),
      )
        .to.emit(sygmaMessageRelayer, "MessageRelayed")
        .withArgs(sygmaMessageRelayer.address, message1.id)
        .and.to.emit(sygmaBridge, "Deposit")
        .withArgs(Chains.Mainnet, resourceID, 1, sygmaMessageRelayer.address, depositData, "0x")
    })
  })
})
