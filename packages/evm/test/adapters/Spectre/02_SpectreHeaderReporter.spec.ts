import { mine } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers, network } from "hardhat"

const DOMAIN_ID = 5
const resourceID = "0x0000000000000000000000000000000000000000000000000000000000000500"
const securityModel = 1
const feeData = "0x"
const maxFee = 950000
const depositNonce = 1

const setup = async () => {
  await network.provider.request({ method: "hardhat_reset", params: [] })
  const signers = await ethers.getSigners()
  const adapter = signers[1].address
  const otherAddress = signers[2].address
  const HeaderStorage = await ethers.getContractFactory("HeaderStorage")
  const headerStorage = await HeaderStorage.deploy()
  const SpectreRouter = await ethers.getContractFactory("MockSpectreRouter")
  const spectreRouter = await SpectreRouter.deploy()
  const SpectreHeaderReporter = await ethers.getContractFactory("SpectreHeaderReporter")
  // IRouter router, HeaderStorage headerStorage, bytes32 resourceID, uint8 defaultDestinationDomainID, address defaultSpectreAdapter
  const spectreHeaderReporter = await SpectreHeaderReporter.deploy(
    spectreRouter.address,
    headerStorage.address,
    resourceID,
    DOMAIN_ID,
    securityModel,
    adapter,
  )
  await mine(10)
  return {
    adapter,
    otherAddress,
    headerStorage,
    spectreRouter,
    spectreHeaderReporter,
  }
}

const prepareDepositData = async (reporterAddress: string, ids: number[], hashes: string[], adapter: string) => {
  const abiCoder = ethers.utils.defaultAbiCoder
  const executionData = abiCoder
    .encode(["address", "uint256[]", "bytes32[]"], [ethers.constants.AddressZero, ids, hashes])
    .substring(66)

  const SpectreAdapter = await ethers.getContractFactory("SpectreAdapter")
  const functionSig = SpectreAdapter.interface.getSighash("storeHashes")

  //   bytes memory depositData = abi.encodePacked(
  //     uint256(950000), / maxFee
  //     uint16(4),
  //     IDepositAdapterTarget(address(0)).execute.selector,
  //     uint8(20),
  //     _targetDepositAdapter,
  //     uint8(20),
  //     _depositorAddress,
  //     abi.encode(depositContractCalldata)
  // );

  const depositData =
    ethers.utils.hexZeroPad(ethers.utils.hexlify(maxFee), 32) +
    "0004" +
    functionSig.substring(2) +
    "14" +
    adapter.toLowerCase().substring(2) +
    "14" +
    reporterAddress.toLowerCase().substring(2) +
    executionData
  return depositData
}

describe("SpectreHeaderReporter", function () {
  describe("Deploy", function () {
    it("Successfully deploys contract", async function () {
      const { spectreRouter, headerStorage, adapter, spectreHeaderReporter } = await setup()
      expect(await spectreHeaderReporter.deployed())
      expect(await spectreHeaderReporter._router()).to.equal(spectreRouter.address)
      expect(await spectreHeaderReporter._headerStorage()).to.equal(headerStorage.address)
      expect(await spectreHeaderReporter._resourceID()).to.equal(resourceID)
      expect(await spectreHeaderReporter._defaultDestinationDomainID()).to.equal(DOMAIN_ID)
      expect(await spectreHeaderReporter._defaultSpectreAdapter()).to.equal(adapter)
    })
  })

  describe("reportHeaders()", function () {
    it("Reports headers to Spectre to default domain", async function () {
      const { spectreHeaderReporter, adapter, spectreRouter, headerStorage } = await setup()
      const block = await ethers.provider._getBlock(9)
      const block2 = await ethers.provider._getBlock(8)
      const depositData = await prepareDepositData(
        spectreHeaderReporter.address,
        [9, 8],
        [block.hash, block2.hash],
        adapter,
      )

      await expect(spectreHeaderReporter.reportHeaders([9, 8], feeData))
        .to.emit(spectreHeaderReporter, "HeaderReported")
        .withArgs(spectreHeaderReporter.address, 9, block.hash)
        .and.to.emit(spectreHeaderReporter, "HeaderReported")
        .withArgs(spectreHeaderReporter.address, 8, block2.hash)
        .and.to.emit(spectreRouter, "Deposit")
        // (destinationDomainID, securityModel, resourceID, depositNonce, msg.sender, depositData, feeData);
        .withArgs(
          DOMAIN_ID,
          securityModel,
          resourceID,
          depositNonce,
          spectreHeaderReporter.address,
          depositData,
          feeData,
        )
      expect(await headerStorage.headers(9)).to.equal(block.hash)
      expect(await headerStorage.headers(8)).to.equal(block2.hash)
    })
  })

  describe("reportHeadersToDomain()", function () {
    it("Reports headers to Spectre to specified domain", async function () {
      const { spectreHeaderReporter, otherAddress, spectreRouter, headerStorage } = await setup()
      const otherDomain = 4
      const block = await ethers.provider._getBlock(9)
      const block2 = await ethers.provider._getBlock(8)
      const depositData = await prepareDepositData(
        spectreHeaderReporter.address,
        [9, 8],
        [block.hash, block2.hash],
        otherAddress,
      )

      await expect(
        spectreHeaderReporter.reportHeadersToDomain([9, 8], otherAddress, otherDomain, securityModel, feeData),
      )
        .to.emit(spectreHeaderReporter, "HeaderReported")
        .withArgs(spectreHeaderReporter.address, 9, block.hash)
        .and.to.emit(spectreHeaderReporter, "HeaderReported")
        .withArgs(spectreHeaderReporter.address, 8, block2.hash)
        .and.to.emit(spectreRouter, "Deposit")
        // (destinationDomainID, securityModel, resourceID, depositNonce, msg.sender, depositData, feeData);
        .withArgs(
          otherDomain,
          securityModel,
          resourceID,
          depositNonce,
          spectreHeaderReporter.address,
          depositData,
          feeData,
        )
      expect(await headerStorage.headers(9)).to.equal(block.hash)
      expect(await headerStorage.headers(8)).to.equal(block2.hash)
    })
  })
})
