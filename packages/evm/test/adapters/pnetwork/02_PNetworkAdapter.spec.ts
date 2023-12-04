import { expect } from "chai"
import { ethers } from "hardhat"

import { ZERO_ADDRESS, deployErc1820Registry, resetNetwork } from "./utils.spec"

const DOMAIN_ID = "0x0000000000000000000000000000000000000000000000000000000000007a69"
const ID_ONE = 1
const ID_TWO = 2
const HASH_ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000"
const HASH_ONE = "0x0000000000000000000000000000000000000000000000000000000000000001"
const HASH_TWO = "0x0000000000000000000000000000000000000000000000000000000000000002"

describe("PNetworkAdapter", function () {
  describe("Host Blockchain", () => {
    const setup = async () => {
      await resetNetwork()
      const [wallet] = await ethers.getSigners()
      await deployErc1820Registry(wallet)
      const PToken = await ethers.getContractFactory("PToken")
      const pToken = await PToken.deploy("pToken", "P", [])
      const PNetworkAdapter = await ethers.getContractFactory("PNetworkAdapter")
      const pNetworkAdapter = await PNetworkAdapter.deploy(ZERO_ADDRESS, pToken.address)
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
        expect(await pNetworkAdapter.token()).to.equal(pToken.address)
        expect(await pNetworkAdapter.admittedSender()).to.equal(ZERO_ADDRESS)
      })
    })

    describe("StoreHashes()", function () {
      it("Stores hashes", async function () {
        const { pNetworkAdapter, wallet, pToken } = await setup()

        const coder = new ethers.utils.AbiCoder()
        const data = coder.encode(
          ["uint256[]", "bytes32[]", "uint256"],
          [[ID_ONE, ID_TWO], [HASH_ONE, HASH_TWO], DOMAIN_ID],
        )
        await pToken.connect(wallet).mint(pNetworkAdapter.address, 1000, data, "0x")
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ONE)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_TWO)
      })

      it("Should not store hashes when receiving another token", async function () {
        const { pNetworkAdapter, wallet } = await setup()

        const PToken = await ethers.getContractFactory("PToken")
        const fakePToken = await PToken.deploy("pToken", "P", [])

        const coder = new ethers.utils.AbiCoder()
        const data = coder.encode(
          ["uint256[]", "bytes32[]", "uint256"],
          [[ID_ONE, ID_TWO], [HASH_ONE, HASH_TWO], DOMAIN_ID],
        )
        await expect(fakePToken.connect(wallet).mint(pNetworkAdapter.address, 1000, data, "0x")).to.be.revertedWith(
          "Only accepted token is allowed",
        )
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ZERO)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_ZERO)
      })

      it("Should not store hashes when tokens are not minted", async function () {
        const { pNetworkAdapter, wallet, pToken } = await setup()

        const coder = new ethers.utils.AbiCoder()
        const data = coder.encode(
          ["uint256[]", "bytes32[]", "uint256"],
          [[ID_ONE, ID_TWO], [HASH_ONE, HASH_TWO], DOMAIN_ID],
        )
        await expect(pToken.connect(wallet).send(pNetworkAdapter.address, 1000, data))
          .to.be.revertedWithCustomError(pNetworkAdapter, "InvalidSender")
          .withArgs(wallet.address)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ZERO)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_ZERO)
      })

      it("Should not store hashes when parallel arrays are mismatched", async function () {
        const { pNetworkAdapter, wallet, pToken } = await setup()

        const coder = new ethers.utils.AbiCoder()
        const data = coder.encode(["uint256[]", "bytes32[]", "uint256"], [[ID_ONE, ID_TWO], [HASH_ONE], DOMAIN_ID])
        await expect(pToken.connect(wallet).mint(pNetworkAdapter.address, 1000, data, "0x"))
          .to.be.revertedWithCustomError(pNetworkAdapter, "ArrayLengthMismatch")
          .withArgs()
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ZERO)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_ZERO)
      })

      it("Overwrites previous hashes", async function () {
        const { pNetworkAdapter, wallet, pToken } = await setup()
        const coder = new ethers.utils.AbiCoder()
        let data = coder.encode(
          ["uint256[]", "bytes32[]", "uint256"],
          [[ID_ONE, ID_TWO], [HASH_ONE, HASH_TWO], DOMAIN_ID],
        )
        await pToken.connect(wallet).mint(pNetworkAdapter.address, 1000, data, "0x")
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ONE)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_TWO)
        data = coder.encode(["uint256[]", "bytes32[]", "uint256"], [[ID_TWO, ID_ONE], [HASH_ONE, HASH_TWO], DOMAIN_ID])
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
      const pNetworkAdapter = await PNetworkAdapter.deploy(vault.address, erc777Token.address)
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
        expect(await pNetworkAdapter.token()).to.equal(erc777Token.address)
        expect(await pNetworkAdapter.admittedSender()).to.equal(vault.address)
      })
    })

    describe("StoreHashes()", function () {
      it("Stores hashes", async function () {
        const { pNetworkAdapter, wallet, vault, erc777Token } = await setup()

        const coder = new ethers.utils.AbiCoder()
        const data = coder.encode(
          ["uint256[]", "bytes32[]", "uint256"],
          [[ID_ONE, ID_TWO], [HASH_ONE, HASH_TWO], DOMAIN_ID],
        )
        await vault.connect(wallet).pegOut(pNetworkAdapter.address, erc777Token.address, 100, data)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ONE)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_TWO)
      })

      it("Should not store hashes when receiving another token", async function () {
        const { pNetworkAdapter, wallet, vault, anotherErc777Token } = await setup()

        const coder = new ethers.utils.AbiCoder()
        const data = coder.encode(
          ["uint256[]", "bytes32[]", "uint256"],
          [[ID_ONE, ID_TWO], [HASH_ONE, HASH_TWO], DOMAIN_ID],
        )
        await expect(
          vault.connect(wallet).pegOut(pNetworkAdapter.address, anotherErc777Token.address, 100, data),
        ).to.be.revertedWith("Only accepted token is allowed")
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ZERO)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_ZERO)
      })

      it("Should not store hashes when tokens are not sent by the vault", async function () {
        const { pNetworkAdapter, wallet, erc777Token } = await setup()

        const coder = new ethers.utils.AbiCoder()
        const data = coder.encode(
          ["uint256[]", "bytes32[]", "uint256"],
          [[ID_ONE, ID_TWO], [HASH_ONE, HASH_TWO], DOMAIN_ID],
        )
        await expect(erc777Token.connect(wallet).send(pNetworkAdapter.address, 100, data))
          .to.be.revertedWithCustomError(pNetworkAdapter, "InvalidSender")
          .withArgs(wallet.address)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ZERO)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_ZERO)
      })

      it("Should not store hashes when parallel arrays are mismatched", async function () {
        const { pNetworkAdapter, wallet, erc777Token, vault } = await setup()
        const coder = new ethers.utils.AbiCoder()
        const data = coder.encode(["uint256[]", "bytes32[]", "uint256"], [[ID_ONE, ID_TWO], [HASH_ONE], DOMAIN_ID])
        await expect(vault.connect(wallet).pegOut(pNetworkAdapter.address, erc777Token.address, 100, data))
          .to.be.revertedWithCustomError(pNetworkAdapter, "ArrayLengthMismatch")
          .withArgs()
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ZERO)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_ZERO)
      })

      it("Overwrites previous hashes", async function () {
        const { pNetworkAdapter, wallet, erc777Token, vault } = await setup()
        const coder = new ethers.utils.AbiCoder()
        let data = coder.encode(
          ["uint256[]", "bytes32[]", "uint256"],
          [[ID_ONE, ID_TWO], [HASH_ONE, HASH_TWO], DOMAIN_ID],
        )
        await vault.connect(wallet).pegOut(pNetworkAdapter.address, erc777Token.address, 50, data)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_ONE)).to.equal(HASH_ONE)
        expect(await pNetworkAdapter.getHashFromOracle(DOMAIN_ID, ID_TWO)).to.equal(HASH_TWO)
        data = coder.encode(["uint256[]", "bytes32[]", "uint256"], [[ID_TWO, ID_ONE], [HASH_ONE, HASH_TWO], DOMAIN_ID])
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
