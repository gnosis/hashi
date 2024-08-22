import { expect } from "chai"
import { ethers, network } from "hardhat"

const VALID_BLOCK_ROOT = "0x21778119263e321fc9e9ca5690d8d4a55dbd4947030fd14319877fe86ecb7de5"
const FINALIZED_SLOT = 5695360
const ATTESTED_SLOT = 5695353
const BLOCK_ROOT_PROOF = [
  "0xbb41fbe3b46fac981d3df3e8629e5e7310185a1f961aba376bcf96e1bd874e28",
  "0x27cbd7708030e106676b683596e811e0bab22138cd7f6913a2bf3b63740daa1f",
  "0x30e26d0ab55a378ffa3ed82e8aa8096eb3b6f4d02f858d6b30d0a13639414abc",
  "0x69ac5f7d1fbca2197d57670e574e3e097a94e5756113c673f4e41fb7be05fc13",
  "0xe9b42d876d7a422dc65f4394e339e3b9042ad40eb11f18c585e534bb3a47443d",
  "0xfefb6d9f04304b533bf67fc11e53a34a08973448a33152613e7ef94f297360b4",
  "0x57dcc8849c3f72f977e31447fd31899a7eff85c04c990ea78dec3bcb98b36802",
  "0xdb56114e00fdd4c1f85c892bf35ac9a89289aaecb1ebd0a96cde606a748b5d71",
  "0x327f2adfa0f0f5c61e4cbcddacf5254d0e7648d30a64191b206f2c145b64bfd5",
  "0x0000000000000000000000000000000000000000000000000000000000000000",
  "0xf5a5fd42d16a20302798ef6ed309979b43003d2320d9f0e8ea9831a92759fb4b",
  "0x878631e8ffef821741c28a205c570a9087c3c80b124b9be1f7284e66a821264e",
  "0x6b0fdfedb1ebb1f2bfcab466d7ba1ff1c83330d2971bca48afd7167695cdd92f",
  "0xc1412f29a954cd3f1be61a15c89ad4751bbf99ea5e6db9c230f630907a9bd02d",
  "0x7aa2c58dc6265c1432df13be057481fb6e6a768748951040b226f520ac3db98f",
  "0xc854071ad4c6627ea7cb962df282bb5f196ac0997412e69a5a8029765d0dd4dc",
  "0x93ee1ce022111ab4b9963409a75427d4f222c56eb893a8a15cd08558b41f4bae",
  "0xec9ec868b016b64ab18fd458176edb153a46f0c42a9e9f0166e24da8284151ba",
  "0x28ce8c0c6f76c0ee6ff6a5e62d716e4d953a1864d60044a97af487eefdc77548",
  "0x6662f6b95c932ba99a9773dca52cd94b79e2a22a6a094235c931ef2c1c1ebe98",
  "0xf935f2f2b59ddfd994b3f2f113fe15b05f3e27bb31e9dda42af9848f654ab175",
  "0x7965303298051020ff8cf76d7f0ad5e1d9fcf85a92e9df291cb7081243227bdd",
  "0xe9fc6a23ead75b105541475f84f38a77bc15e73122d56d013c9ce78797d142d4",
  "0x50ee4913ad51f139eacd4239481bfaa78e7cbe24b298b4108b901dcb92076ea0",
  "0xa19e1d43afb1c9bb9044278b8fc626d493cb9eabca295fc449aa4cf992b9f847",
  "0x2f630e4ee1785e0292af4667b5157b3e966a1e0b8bcad4a3df727bfd2268460a",
  "0x5fbcd76ca37f9948be8c6311a5b6cc2a7090cdceaa7a27741bbd86eb4775ba46",
  "0xae4b78ed6c0c6823750a22a6b0c2ae6397316eaa72d081f101c5f9e3d80eccca",
  "0xb02c1c50b30dc30509964dfe3135b5605e687b35c61ae1ecd51807fe0f321c73",
  "0x5168c522d5c2bb2637b8f43831bf78ad9c072f8cb10a6994b15de93e1c6c7054",
  "0x80348cee4cd87fc19e81fc1ab0d99055fe51aba331dd10348fc6b3def42e1373",
  "0x7dd3b024989ee3ba4d612a8038a465302dd9a9a230c259db7ec79a0d59d437e8",
  "0x1802ea95218e92f7c59bb5da3adf73d4bab7efe723e100886262f2fedffa82a6",
]
const RECEIPT_ROOT = "0xd84fe72ebbc7d725297e7de74628a7b594a34997218d3eb0c94e2c88b49b679e"
const RECEIPT_PROOF = [
  "0xf90111a0d796d78912c8f7f0264489b41970b757d0de0dff0002c3836f92b204b23cfd0ca00a0d07f2d4c747362bc2fb76371bb29e5e96d4eaa42bb150e884fe16fab30bc6a0d0d0c5fd8815dffb371f9af7d8054e4371760235ec5a94ede508db83896f1dffa0efe5a66c883aa270bc79bf09ac6388caffb55ab7763588a47e3da4577bec67a2a094a9cc0f8266bb8385dc7e7670a6ef79ed18ecab0c04f74a1dd4d3038fae61bea0d1e4d7546d7870c9600285a645944480227b982be7533bc741524c0ffadc5e48a08c07352e2cd34dcddcb3977c8299854f4d39d54e6284bd37b2b0447bfce6e96780a0923f5cd8f74f85139f72eedf87d303d8066e2fd02f511671c172cc85084aae2c8080808080808080",
  "0xf901f180a0719191dbc2edcbebf7a622644be3104422e7db547fd9a879121b2abfa0b34020a0a5406d11635972f187bc0888366448c5d441fddc6a7487d03e417a07d9df47bea0185e5ad44a8c439541239ac4ff0391c811d3c1909b61a519f4663e4bc813c169a0cb2b36f4f9e10767bb23b4cc02335a9bec669524a1acb529886812ebee475a95a083a8760b96414e915aa3112c3bd1be95ace88ac1ce544211686e04643d83f248a082cc986b27e1bb7daa57da34179b818696487cbcc7ee27a7bf28e14143be2ccea0bd1228e14c526ab7c6277ad68be512937f57fd72e87caf96329c59db729f9278a06343de45f16e4fea4598a69cbf8ed9172f2d1a435c3b1e5f463f81faa75e5bb3a0c116e535585bc8a92a3a3af3713cf502de809e644b72234a384d2768c01d4b9ba052ca43b677c29069a603c05707b03dc7f87cd3a52c8e5965a2fef9b11b66ce69a057917dd7b8ea46f06cd34cd1dce1940bf9b135ec3bb6e9c063b32633d40c7b78a01469d300559e5f0ac180235a556b02b545557690de90e1058e10fe0f0e6418b3a0850a54243d0d09ea0cd66bf942f2aba3e3a09998171f745a234a53b4a40d0954a08a3672065ed6c6dc656670ec06390998ae029544c1eae88f937a568bf46c2ce4a01d0af7637d3615b7d433d64a2eade9d2aca1626af411682a3e70c7ba308f46ca80",
  "0xf9062820b90624f906210183091829b90100000000000000000000000d0008020001000000000000000000000000000000000000000000800000000000000000000020000000000000000000000100000000001000000000000010000000000000000000000000020000000000000000800000000000000000000000000000000200100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000010000000000000000000080000000000000000000000002000000000000040001000000000000200000000200400004000000000000200000080010000000000000000000000000000000000000000004000000040000080001000000000000f90516f9023c9421eab033c7d2df6a67aef6c5bda9a7f151eb9f52f842a0218247aabc759e65b5bb92ccc074f9d62cd187259f2a0984c3c9cf91f67ff7cfa0f17e52a0ade03ab5e2ceb4955f720c593b8094417e354c033b34db8afc5f806fb901e0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000009f900000000000000000000000000000000000000000000000000000000000027d80000000000000000000000000000000000000000000000000000000000000001000000000000000000000000ec62ae0516e9fd565d3084eed742b4f196356df2000000000000000000000000a86bc62ac53dc86687ab6c15fdebc71ad51fb615000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000c6755144d60548f3dd420f47cf48dae553bbf04200000000000000000000000000000000000000000000000000000000000000010000000000000000000000003f5929bee6a59661d6ccc9c4eb751048009ce11bf8bc94c6755144d60548f3dd420f47cf48dae553bbf042f863a0d05d8e0013365e4d441d98e6459477af9dd142c5cf590e87ca927921993b6c62a000000000000000000000000000000000000000000000000000000000000027d8a0f17e52a0ade03ab5e2ceb4955f720c593b8094417e354c033b34db8afc5f806fb8400000000000000000000000003f5929bee6a59661d6ccc9c4eb751048009ce11ba319fa327c587841e94c1cbb3106de0a17067334e7243045a7f06a5940d749e6f901bc94f2546d6648bd2af6a008a7e7c1542bb240329e11f842a0482515ce3d9494a37ce83f18b72b363449458435fafdd7a53ddea7460fe01b58a0000500000735a05d7e98453b1abcedec7918072d3d6f5ec20000000000000f8fb9016000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000118000500000735a05d7e98453b1abcedec7918072d3d6f5ec20000000000000f8fc6755144d60548f3dd420f47cf48dae553bbf0423f5929bee6a59661d6ccc9c4eb751048009ce11b0007a120030200aa36a727d869f55903000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000001f17e52a0ade03ab5e2ceb4955f720c593b8094417e354c033b34db8afc5f806f0000000000000000000000000000000000000000000000000000000000000001a319fa327c587841e94c1cbb3106de0a17067334e7243045a7f06a5940d749e60000000000000000f85894ec62ae0516e9fd565d3084eed742b4f196356df2e1a058b69f57828e6962d216502094c54f6562f3bf082ba758966c3454f9e37b1525a00000000000000000000000000000000000000000000000000000000000000992",
]
const TX_INDEX = "0x05"
const LOG_INDEX = 0

const setup = async () => {
  await network.provider.request({ method: "hardhat_reset", params: [] })
  const signers = await ethers.getSigners()
  const admin = signers[0]
  const yahoAddress = "0x21eAB033C7D2DF6A67AeF6C5Bda9A7F151eB9f52"
  const sourceChainId = 11155111
  const EthereumTrieDB = await ethers.getContractFactory("EthereumTrieDB")
  const ethereumTrieDB = await EthereumTrieDB.deploy()
  const MerklePatricia = await ethers.getContractFactory("MerklePatricia", {
    libraries: {
      EthereumTrieDB: ethereumTrieDB.address,
    },
  })
  const merklePatricia = await MerklePatricia.deploy()
  const SpectreAdapter = await ethers.getContractFactory("SpectreAdapter", {
    libraries: {
      MerklePatricia: merklePatricia.address,
    },
  })
  const MockSpectre = await ethers.getContractFactory("MockSpectre")
  const spectre = await MockSpectre.deploy()
  const spectreAdapter = await SpectreAdapter.deploy(spectre.address, sourceChainId, yahoAddress)
  await spectreAdapter.deployed()
  return {
    admin,
    yahoAddress,
    sourceChainId,
    spectre,
    spectreAdapter,
  }
}

describe("SpectreAdapter", function () {
  describe("Constructor", function () {
    it("Successfully deploys contract with correct state", async function () {
      const { spectre, sourceChainId, yahoAddress, spectreAdapter } = await setup()

      expect(await spectreAdapter.spectreAddress()).to.equal(spectre.address)
      expect(await spectreAdapter.SOURCE_YAHO()).to.equal(yahoAddress)
      expect(await spectreAdapter.SOURCE_CHAIN_ID()).to.equal(sourceChainId)
    })
  })

  describe("changeSpectreAddress()", function () {
    it("Successfully changes address when admin address used", async function () {
      const { spectreAdapter } = await setup()
      const newAddress = "0x0b51633aE43BF1BaC0cf6149beC37096241C0Cf4"

      await spectreAdapter.changeSpectreAddress(newAddress)

      expect(await spectreAdapter.spectreAddress()).to.equal(newAddress)
    })

    it("Reverts when admin address not used", async function () {
      let { spectreAdapter } = await setup()
      const signers = await ethers.getSigners()
      spectreAdapter = spectreAdapter.connect(signers[1])
      const newAddress = "0x0b51633aE43BF1BaC0cf6149beC37096241C0Cf4"

      await expect(spectreAdapter.changeSpectreAddress(newAddress)).to.be.revertedWithCustomError(
        spectreAdapter,
        "Unauthorized",
      )
    })
  })

  describe("verifyAndStoreDispatchedMessage()", function () {
    it("Succesfully verifies a valid `MessageDispatched` event and stores hash", async function () {
      const { spectreAdapter, spectre, sourceChainId } = await setup()
      await spectre.setRoot(FINALIZED_SLOT, VALID_BLOCK_ROOT)

      const tx = await spectreAdapter.verifyAndStoreDispatchedMessage(
        FINALIZED_SLOT,
        ATTESTED_SLOT,
        BLOCK_ROOT_PROOF,
        RECEIPT_ROOT,
        RECEIPT_PROOF,
        TX_INDEX,
        LOG_INDEX,
      )

      const expectedId = "109230589513832448651825219171321317961370859414947483691584271680487324352623"
      const expectedHash = "0xa319fa327c587841e94c1cbb3106de0a17067334e7243045a7f06a5940d749e6"
      await expect(tx).to.emit(spectreAdapter, "HashStored").withArgs(expectedId, expectedHash)
      expect(await spectreAdapter.getHash(sourceChainId, expectedId)).to.equal(expectedHash)
    })

    it("Reverts with invalid block root", async function () {
      const { spectreAdapter, spectre } = await setup()
      await spectre.setRoot(FINALIZED_SLOT, "0x21787119263e321fc9e9ca5690d8d4a55dbd4947030fd14319877fe86ecb7de5")

      await expect(
        spectreAdapter.verifyAndStoreDispatchedMessage(
          FINALIZED_SLOT,
          ATTESTED_SLOT,
          BLOCK_ROOT_PROOF,
          RECEIPT_ROOT,
          RECEIPT_PROOF,
          TX_INDEX,
          LOG_INDEX,
        ),
      ).to.be.revertedWithCustomError(spectreAdapter, "InvalidReceiptsRoot")
    })

    it("Reverts when receipt root invalid", async function () {
      const { spectreAdapter, spectre } = await setup()
      await spectre.setRoot(FINALIZED_SLOT, VALID_BLOCK_ROOT)

      await expect(
        spectreAdapter.verifyAndStoreDispatchedMessage(
          FINALIZED_SLOT,
          ATTESTED_SLOT,
          BLOCK_ROOT_PROOF,
          "0xd85fe72ebbc7d725297e7de74628a7b594a34997218d3eb0c94e2c88b49b679e",
          RECEIPT_PROOF,
          TX_INDEX,
          LOG_INDEX,
        ),
      ).to.be.revertedWithCustomError(spectreAdapter, "InvalidReceiptsRoot")
    })

    it("Reverts when block root is missing", async function () {
      const { spectreAdapter } = await setup()

      await expect(
        spectreAdapter.verifyAndStoreDispatchedMessage(
          FINALIZED_SLOT,
          ATTESTED_SLOT,
          BLOCK_ROOT_PROOF,
          RECEIPT_ROOT,
          RECEIPT_PROOF,
          TX_INDEX,
          LOG_INDEX,
        ),
      ).to.be.revertedWithCustomError(spectreAdapter, "BlockHeaderRootMissing")
    })

    it("Reverts when `MessageDispatched` signature is invalid", async function () {
      const { spectreAdapter, spectre } = await setup()
      await spectre.setRoot(FINALIZED_SLOT, VALID_BLOCK_ROOT)

      await expect(
        spectreAdapter.verifyAndStoreDispatchedMessage(
          FINALIZED_SLOT,
          ATTESTED_SLOT,
          BLOCK_ROOT_PROOF,
          RECEIPT_ROOT,
          RECEIPT_PROOF,
          TX_INDEX,
          1,
        ),
      ).to.be.revertedWithCustomError(spectreAdapter, "InvalidEventSignature")
    })
  })
})
