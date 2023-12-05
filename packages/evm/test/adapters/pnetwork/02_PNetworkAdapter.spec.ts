import { expect } from "chai"
import { ethers } from "hardhat"

import { ZERO_ADDRESS, deployErc1820Registry, resetNetwork } from "./utils.spec"

const REPORTER_ADDRESS = "0xd5e099c71b797516c10ed0f0d895f429c2781142"
const DOMAIN_ID = "0x0000000000000000000000000000000000000000000000000000000000001"
const ID_ONE = 1
const ID_TWO = 2
const HASH_ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000"
const HASH_ONE = "0x0000000000000000000000000000000000000000000000000000000000000001"
const HASH_TWO = "0x0000000000000000000000000000000000000000000000000000000000000002"

const encodeToMetadata = (userData: string, originChainId: string, sender: string, version = 3) =>
  new ethers.utils.AbiCoder().encode(
    ["bytes1", "bytes", "bytes4", "address"],
    [version, userData, originChainId, sender],
  )

describe("PNetworkAdapter", function () {
  describe("Host Blockchain", () => {
    const setup = async () => {
      await resetNetwork()
      const [wallet] = await ethers.getSigners()
      await deployErc1820Registry(wallet)
      const PToken = await ethers.getContractFactory("PToken")
      const pToken = await PToken.deploy("pToken", "P", [])
      const PNetworkAdapter = await ethers.getContractFactory("PNetworkAdapter")
      const pNetworkAdapter = await PNetworkAdapter.deploy(DOMAIN_ID, REPORTER_ADDRESS, ZERO_ADDRESS, pToken.address)
      return {
        wallet,
        pNetworkAdapter,
        pToken,
      }
    }

    describe("Constructor", function () {
      it("Successfully deploys contract with correct state", async function () {
        const { pNetworkAdapter, pToken } = await setup()

        expect(await pNetworkAdapter.deployed())
        expect(await pNetworkAdapter.TOKEN()).to.equal(pToken.address)
        expect(await pNetworkAdapter.ADMITTED_SENDER()).to.equal(ZERO_ADDRESS)
      })
    })

    describe("StoreHashes()", function () {
      it("Should store hashes", async function () {
        const { pNetworkAdapter, wallet, pToken } = await setup()

        const coder = new ethers.utils.AbiCoder()
        const userData = coder.encode(
          ["uint256[]", "bytes32[]"],
          [
            [ID_ONE, ID_TWO],
            [HASH_ONE, HASH_TWO],
          ],
        )
        const data = encodeToMetadata(userData, "0x005fe7f9", REPORTER_ADDRESS)
        await pToken.connect(wallet).mint(pNetworkAdapter.address, 1000, data, "0x")
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ONE)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_TWO)
      })

      it("Should not store hashes when receiving another token", async function () {
        const { pNetworkAdapter, wallet } = await setup()

        const PToken = await ethers.getContractFactory("PToken")
        const fakePToken = await PToken.deploy("pToken", "P", [])

        const coder = new ethers.utils.AbiCoder()
        const userData = coder.encode(
          ["uint256[]", "bytes32[]"],
          [
            [ID_ONE, ID_TWO],
            [HASH_ONE, HASH_TWO],
          ],
        )
        const data = encodeToMetadata(userData, "0x005fe7f9", REPORTER_ADDRESS)
        await expect(fakePToken.connect(wallet).mint(pNetworkAdapter.address, 1000, data, "0x")).to.be.revertedWith(
          "Only accepted token is allowed",
        )
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ZERO)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_ZERO)
      })

      it("Should not store hashes when tokens are not minted", async function () {
        const { pNetworkAdapter, wallet, pToken } = await setup()

        const coder = new ethers.utils.AbiCoder()
        const userData = coder.encode(
          ["uint256[]", "bytes32[]"],
          [
            [ID_ONE, ID_TWO],
            [HASH_ONE, HASH_TWO],
          ],
        )
        const data = encodeToMetadata(userData, "0x005fe7f9", REPORTER_ADDRESS)
        await expect(pToken.connect(wallet).send(pNetworkAdapter.address, 1000, data))
          .to.be.revertedWithCustomError(pNetworkAdapter, "InvalidSender")
          .withArgs(wallet.address)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ZERO)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_ZERO)
      })

      it("Overwrites previous hashes", async function () {
        const { pNetworkAdapter, wallet, pToken } = await setup()
        const coder = new ethers.utils.AbiCoder()
        let userData = coder.encode(
          ["uint256[]", "bytes32[]"],
          [
            [ID_ONE, ID_TWO],
            [HASH_ONE, HASH_TWO],
          ],
        )
        let data = encodeToMetadata(userData, "0x005fe7f9", REPORTER_ADDRESS)
        await pToken.connect(wallet).mint(pNetworkAdapter.address, 1000, data, "0x")
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ONE)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_TWO)
        userData = coder.encode(
          ["uint256[]", "bytes32[]"],
          [
            [ID_TWO, ID_ONE],
            [HASH_ONE, HASH_TWO],
          ],
        )
        data = encodeToMetadata(userData, "0x005fe7f9", REPORTER_ADDRESS)
        await pToken.connect(wallet).mint(pNetworkAdapter.address, 1000, data, "0x")
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_TWO)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_ONE)
      })

      it("Returns 0 if no header is stored", async function () {
        const { pNetworkAdapter } = await setup()
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ZERO)
      })
    })
  })

  describe("Native Blockchain", () => {
    const setup = async () => {
      await resetNetwork()
      const [wallet] = await ethers.getSigners()
      await deployErc1820Registry(wallet)
      const ERC777Token = await ethers.getContractFactory("ERC777Token")
      const erc777Token = await ERC777Token.deploy("ERC777 Token", "E777", [])
      const anotherErc777Token = await ERC777Token.deploy("Another ERC777 Token", "A777", [])
      const Vault = await ethers.getContractFactory("MockVault")
      const vault = await Vault.deploy()
      await vault.initialize([erc777Token.address, anotherErc777Token.address], "0x12345678")

      const PNetworkAdapter = await ethers.getContractFactory("PNetworkAdapter")
      const pNetworkAdapter = await PNetworkAdapter.deploy(
        DOMAIN_ID,
        REPORTER_ADDRESS,
        vault.address,
        erc777Token.address,
      )

      const coder = new ethers.utils.AbiCoder()
      const data = coder.encode(
        ["bytes32", "string", "bytes4"],
        [ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ERC777-pegIn")), "destination-address", "0x87654321"],
      )
      await expect(erc777Token.connect(wallet).send(vault.address, 100, data)).to.emit(vault, "PegIn")
      await expect(anotherErc777Token.connect(wallet).send(vault.address, 100, data)).to.emit(vault, "PegIn")
      return {
        wallet,
        vault,
        pNetworkAdapter,
        erc777Token,
        anotherErc777Token,
      }
    }

    describe("Constructor", function () {
      it("Successfully deploys contract with correct state", async function () {
        const { pNetworkAdapter, erc777Token, vault } = await setup()
        expect(await pNetworkAdapter.deployed())
        expect(await pNetworkAdapter.TOKEN()).to.equal(erc777Token.address)
        expect(await pNetworkAdapter.ADMITTED_SENDER()).to.equal(vault.address)
      })
    })

    describe("StoreHashes()", function () {
      it("Stores hashes", async function () {
        const { pNetworkAdapter, wallet, vault, erc777Token } = await setup()

        const coder = new ethers.utils.AbiCoder()
        const userData = coder.encode(
          ["uint256[]", "bytes32[]"],
          [
            [ID_ONE, ID_TWO],
            [HASH_ONE, HASH_TWO],
          ],
        )
        const data = encodeToMetadata(userData, "0x005fe7f9", REPORTER_ADDRESS)
        await vault.connect(wallet).pegOut(pNetworkAdapter.address, erc777Token.address, 100, data)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ONE)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_TWO)
      })

      it("Should not store hashes when receiving another token", async function () {
        const { pNetworkAdapter, wallet, vault, anotherErc777Token } = await setup()

        const coder = new ethers.utils.AbiCoder()
        const userData = coder.encode(
          ["uint256[]", "bytes32[]"],
          [
            [ID_ONE, ID_TWO],
            [HASH_ONE, HASH_TWO],
          ],
        )
        const data = encodeToMetadata(userData, "0x005fe7f9", REPORTER_ADDRESS)
        await expect(
          vault.connect(wallet).pegOut(pNetworkAdapter.address, anotherErc777Token.address, 100, data),
        ).to.be.revertedWith("Only accepted token is allowed")
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ZERO)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_ZERO)
      })

      it("Should not store hashes when tokens are not sent by the vault", async function () {
        const { pNetworkAdapter, wallet, erc777Token } = await setup()

        const coder = new ethers.utils.AbiCoder()
        const userData = coder.encode(
          ["uint256[]", "bytes32[]"],
          [
            [ID_ONE, ID_TWO],
            [HASH_ONE, HASH_TWO],
          ],
        )
        const data = encodeToMetadata(userData, "0x005fe7f9", REPORTER_ADDRESS)
        await expect(erc777Token.connect(wallet).send(pNetworkAdapter.address, 100, data))
          .to.be.revertedWithCustomError(pNetworkAdapter, "InvalidSender")
          .withArgs(wallet.address)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ZERO)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_ZERO)
      })

      it("Should not store hashes when data is received from another chain", async function () {
        const { pNetworkAdapter, wallet, vault, erc777Token } = await setup()

        const coder = new ethers.utils.AbiCoder()
        const userData = coder.encode(
          ["uint256[]", "bytes32[]"],
          [
            [ID_ONE, ID_TWO],
            [HASH_ONE, HASH_TWO],
          ],
        )
        const data = encodeToMetadata(userData, "0x00e4b170", REPORTER_ADDRESS)
        await expect(
          vault.connect(wallet).pegOut(pNetworkAdapter.address, erc777Token.address, 100, data),
        ).to.be.revertedWith("Invalid source network ID")
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ZERO)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_ZERO)
      })

      it("Should not store hashes when data originated from another address", async function () {
        const { pNetworkAdapter, wallet, vault, erc777Token } = await setup()
        const WRONG_REPORTER_ADDRESS = "0xa5e099c71b797516c10ed0f0d895f429c2781142"

        const coder = new ethers.utils.AbiCoder()
        const userData = coder.encode(
          ["uint256[]", "bytes32[]"],
          [
            [ID_ONE, ID_TWO],
            [HASH_ONE, HASH_TWO],
          ],
        )
        const data = encodeToMetadata(userData, "0x005fe7f9", WRONG_REPORTER_ADDRESS)
        await expect(
          vault.connect(wallet).pegOut(pNetworkAdapter.address, erc777Token.address, 100, data),
        ).to.be.revertedWith("Invalid reporter")
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ZERO)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_ZERO)
      })

      it("Overwrites previous hashes", async function () {
        const { pNetworkAdapter, wallet, erc777Token, vault } = await setup()
        const coder = new ethers.utils.AbiCoder()
        let userData = coder.encode(
          ["uint256[]", "bytes32[]"],
          [
            [ID_ONE, ID_TWO],
            [HASH_ONE, HASH_TWO],
          ],
        )
        let data = encodeToMetadata(userData, "0x005fe7f9", REPORTER_ADDRESS)
        await vault.connect(wallet).pegOut(pNetworkAdapter.address, erc777Token.address, 50, data)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ONE)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_TWO)
        userData = coder.encode(
          ["uint256[]", "bytes32[]"],
          [
            [ID_TWO, ID_ONE],
            [HASH_ONE, HASH_TWO],
          ],
        )
        data = encodeToMetadata(userData, "0x005fe7f9", REPORTER_ADDRESS)
        await vault.connect(wallet).pegOut(pNetworkAdapter.address, erc777Token.address, 50, data)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_TWO)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_ONE)
      })

      it("Returns 0 if no header is stored", async function () {
        const { pNetworkAdapter } = await setup()
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ZERO)
      })
    })
  })
})
