import { mine } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers, network } from "hardhat"

const DOMAIN_ID = 5
const resourceID = "0x0000000000000000000000000000000000000000000000000000000000000500"

const setup = async () => {
  await network.provider.request({ method: "hardhat_reset", params: [] })
  const signers = await ethers.getSigners()
  const adapter = signers[1].address
  const otherAddress = signers[2].address
  const HeaderStorage = await ethers.getContractFactory("HeaderStorage")
  const headerStorage = await HeaderStorage.deploy()
  const SygmaBridge = await ethers.getContractFactory("MockSygmaBridge")
  const sygmaBridge = await SygmaBridge.deploy()
  const SygmaHeaderReporter = await ethers.getContractFactory("SygmaHeaderReporter")
  // IBridge bridge, HeaderStorage headerStorage, bytes32 resourceID, uint8 defaultDestinationDomainID, address defaultSygmaAdapter
  const sygmaHeaderReporter = await SygmaHeaderReporter.deploy(
    sygmaBridge.address,
    headerStorage.address,
    resourceID,
    DOMAIN_ID,
    adapter,
  )
  await mine(10)
  return {
    adapter,
    otherAddress,
    headerStorage,
    sygmaBridge,
    sygmaHeaderReporter,
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

describe("SygmaHeaderReporter", function () {
  describe("Deploy", function () {
    it("Successfully deploys contract", async function () {
      const { sygmaBridge, headerStorage, adapter, sygmaHeaderReporter } = await setup()
      expect(await sygmaHeaderReporter.deployed())
      expect(await sygmaHeaderReporter._bridge()).to.equal(sygmaBridge.address)
      expect(await sygmaHeaderReporter._headerStorage()).to.equal(headerStorage.address)
      expect(await sygmaHeaderReporter._resourceID()).to.equal(resourceID)
      expect(await sygmaHeaderReporter._defaultDestinationDomainID()).to.equal(DOMAIN_ID)
      expect(await sygmaHeaderReporter._defaultSygmaAdapter()).to.equal(adapter)
    })
  })

  describe("reportHeaders()", function () {
    it("Reports headers to Sygma to default domain", async function () {
      const { sygmaHeaderReporter, adapter, sygmaBridge, headerStorage } = await setup()
      const block = await ethers.provider._getBlock(9)
      const block2 = await ethers.provider._getBlock(8)
      const depositData = await prepareDepositData(
        sygmaHeaderReporter.address,
        [9, 8],
        [block.hash, block2.hash],
        adapter,
      )

      await expect(sygmaHeaderReporter.reportHeaders([9, 8], "0x00"))
        .to.emit(sygmaHeaderReporter, "HeaderReported")
        .withArgs(sygmaHeaderReporter.address, 9, block.hash)
        .and.to.emit(sygmaHeaderReporter, "HeaderReported")
        .withArgs(sygmaHeaderReporter.address, 8, block2.hash)
        .and.to.emit(sygmaBridge, "Deposit")
        // (destinationDomainID, resourceID, 1, msg.sender, depositData, feeData);
        .withArgs(DOMAIN_ID, resourceID, 1, sygmaHeaderReporter.address, depositData, "0x00")
      expect(await headerStorage.headers(9)).to.equal(block.hash)
      expect(await headerStorage.headers(8)).to.equal(block2.hash)
    })
  })

  describe("reportHeadersToDomain()", function () {
    it("Reports headers to Sygma to specified domain", async function () {
      const { sygmaHeaderReporter, otherAddress, sygmaBridge, headerStorage } = await setup()
      const otherDomain = 4
      const block = await ethers.provider._getBlock(9)
      const block2 = await ethers.provider._getBlock(8)
      const depositData = await prepareDepositData(
        sygmaHeaderReporter.address,
        [9, 8],
        [block.hash, block2.hash],
        otherAddress,
      )

      await expect(sygmaHeaderReporter.reportHeadersToDomain([9, 8], otherAddress, otherDomain, "0x00"))
        .to.emit(sygmaHeaderReporter, "HeaderReported")
        .withArgs(sygmaHeaderReporter.address, 9, block.hash)
        .and.to.emit(sygmaHeaderReporter, "HeaderReported")
        .withArgs(sygmaHeaderReporter.address, 8, block2.hash)
        .and.to.emit(sygmaBridge, "Deposit")
        // (destinationDomainID, resourceID, 1, msg.sender, depositData, feeData);
        .withArgs(otherDomain, resourceID, 1, sygmaHeaderReporter.address, depositData, "0x00")
      expect(await headerStorage.headers(9)).to.equal(block.hash)
      expect(await headerStorage.headers(8)).to.equal(block2.hash)
    })
  })
})
