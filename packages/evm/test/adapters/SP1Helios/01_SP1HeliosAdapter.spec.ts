import { expect } from "chai"
import { ethers, network } from "hardhat"

const YAHO_ADDRESS = "0xbAE4Ebbf42815BB9Bc3720267Ea4496277d60DB8"
const SOURCE_CHAIN_ID = 1
const VALID_BLOCK_ROOT = "0x582a3ae01f50fbd2c1951593d5f171eea0ae2ff9006bfb74aa8564f9265f02e6"
const SOURCE_SLOT = 10793312
const SLOT = 10793291
const RECEIPT_ROOT_PROOF = [
  "0x025719a7cf0994dfee5814b8df2668aef635fcb68d6113ac34aab245954c7e27",
  "0xae5aff3669f116f0172e45bb98acaeb928feed6f7a1980fe75b10ae713d9dee7",
  "0x3c47dfa0888d0adfca81113bb2a00720a4d3bc400b17c178cf22ca7dbb4cd385",
  "0xbc05149553af2e28a5928c0b3193b122da8301abf1876b79ca7249838b04a147",
  "0x501d9b2643efcede4dd1cd0c384c1faa492b52465ef52a359f01532a31ddb3d9",
  "0x73f232f0a78a6e8db21cd31ed233cec4f5ba747e299a9f266aa0023fd2876cf1",
  "0xe20d99926879165d112091ec63a3610fbb62eee8402f317e1595cb21f76b9b8b",
  "0xdb56114e00fdd4c1f85c892bf35ac9a89289aaecb1ebd0a96cde606a748b5d71",
  "0xc97384a497afd1e3dea34f703ed772d7d0105465189ff40c870eb8001d4eae28",
  "0x0000000000000000000000000000000000000000000000000000000000000000",
  "0xf5a5fd42d16a20302798ef6ed309979b43003d2320d9f0e8ea9831a92759fb4b",
  "0x064402e78de6649860dfca056fd920c4374a1b8a610e0e00619ad041a6e6746e",
  "0x8cbefa5e8d6c4f6c90f7c019da24493dca9719af2d118f2e31a5dccee3464443",
  "0xc64a29f07cdcb8cd63cec67a4159503a6ba8cfbcf57152afc8aa32f272a4e445",
  "0x28b6f1c356e3ffe10323f53b09f81facb7e73e328aaea5c839c824f8a085f83b",
  "0xcc4e8343ffcda51f5169217819b10d4c8892ff048b5477a81f7596d05d2bc3b4",
  "0x656c2b9fdb76ebadb2594843e462559dd36e6c2780fa9e2076c3c15f90d6b547",
  "0x068fe54153d77bd70dff443c6dfeab008f3d4aaade081efddb6fbd14116f5a8d",
  "0x4b13e0e04f9cd598dfd7abe2b2671855b90d17d43706527286f9d123f30ab983",
  "0xd5149506b82ddda91424057fe2bf22667507a76499fa4a3e89d9196715a6a082",
  "0x361d068fadd23086a08fddb7cb65988ea451f3687f6aeb9d33bf0dfbe4811feb",
  "0xeca70d9681ca640f56d4ebf65891c3b50fa2fe97af3bd63f2f5a01cef9873d40",
  "0xccb0e664b3a05530e3d2091da4f108b5d05a7141ba018d0442c45b92bb38c154",
  "0x84506f73b09bdd4e030edadf477c79ba2d2cea42791648b705cdf3ea181abf62",
  "0xb4a3230eea4573f7d0c7834ed565eb62265645d01ce484ffd6a4bfea2caad7d3",
  "0x962b0c978e7083bd820611bea7b159f5f3d30df76acfcc6890275de4fb85bb0d",
  "0xc718e6c8c064b4f416bc9e67563b0d758b258dc3eec1de68a5ab35c9a1944a4a",
  "0x770428d3fae85c9ed9ff05d7159c7da761b330da7a68e8b74e0930d006373b15",
  "0x8e25d09cbcb67f3d75bf3c5e5ad8e9b857b2a927c4d3a28a071b8458dc0b30f2",
  "0x74e8147fbe4dbcca62d2f99ee8acfee8e882289f7cf05c57c83eb71d3a040e0e",
  "0x20a1c8650ed5a30ac72f2d7c8fadc7e87d19098af2b696436596a55a1bd2265c",
  "0x47c594e67300ba315c9b948457f86d6dcc2eaba9dfe8f51bfc36e21a0f5e212d",
  "0x35455b7e495b26fbf1a13a3c9cea05698526e570c0afacf9aa7646f9f6b6eb43",
]
const RECEIPT_ROOT = "0xa82b59d750c71bb8258c020d231f7d3e489a8a8f76e13361405084fe2922fe0c"
const RECEIPT_PROOF = [
  "0xf90131a04506f1f147d67f824b2577e63e0f2b87622a0e8061417cf25bd9b916fbc547f7a018970ac6ca17dc7b28485189420c394aee41cfc8359c26ce5aa95bea3614fdc9a053d7665fa3041425aab804bd97634ace978cf93265dea8dc0c3cc3f7e1a66f69a0fa51f7ab92982b2b2d66bbe220c8e4d98905c4cf65672b557c2d6921969e0d83a031d25f6a233e48ed01d99adc1f62efc23cfb39a78cf5c8ce7ab8065b20b5add4a08936e6d7915b8518ebd56baa94d689ff5388cf3d3e1e5d40ce9755c17df8afe9a025ae97bb264e338142d40b2bc59dde11cfb9ef0ad21b034c368de4666a37056ba0e00c10b02373e8cc391dfdbc25c9dfa955f80d1fd19a165002fec20af708db0da01b484392f5c3a1641a25b380ec41ca2feaca9b7d5ab2623231b82b744f13cbf68080808080808080",
  "0xf90211a0005f1fd974c52f9b0d8e951cc3adf6ed7a2e55e4ce6463427551de2b325aff70a011c44cdcbe902a2b5ea23b55771727ad9083e6f039feead970b8f31dd0d96654a07d9e54e191ae316704573a5171218b0072c917384f0727f44e2a58c49f19eda3a0481432a65758c53aad04066ae15545738ad58912d02e4fd9260ed77f2889e047a00b304a3e6f098cc325fe45a532b87c952be15db57a03a243511940ea73e8ca70a02687115eb26aff8e5916582f19ca6258b3e38e8faaa4f9308af7de038212cae4a0c34a0bbf7eca4bf956cda77ac4e8324aefcad3a6a32e5af521c60ccac5cca82ba04a6df60828fead82d648aa31ab485b45e09e12b32cb829f00b5ca6078c6ec1f5a0514ddfe76b7ce8673cee4a4dc57483498e5e8f6fb88a076b6c04346fdddb27caa014bfa86cdb03f45458833f43b22b03767dd35be7be5368f4ef1674af8b09f15fa0ffb68469eac5ca20e1f0c02e791196b33612ff6369d9263777ad8c5d1f941f2fa0a82e4d829416ae733d473c725dfa49e7503bc1df06176a41a8796bee4377420ba0e7eb04e84f6ae07021090c8a3179ff27dac3d599893dd66f54c622e388c63ecaa02401136b0ab6a48b1f7336818595146aef0556f6e7ed9628d2f5464c73fd70d6a0dc06eca393e539b6d24fcca3ab942853f9af303d3345a9cc5812722ea737cbf1a0b789057be47cd9d4f537519c37340c1df9ce3e12cd31e8b07c3d27f2d547808f80",
  "0xf9072820b9072402f90720018377492cb9010000004000000000000000000000000001000000000000000080000000000000000000000100000000000000000000000002000000080010000000000200000000000820000000004008000008000000800000000000020000000000008000000000000010000000000080000000000000100000000000000000000010000000000000000000000000008000400000000000000001000000000000000000000000000001000000000000000000000000000000000000000000000000800000808000000002000000200000000000480000000000000000000000000000000000000000200020100000900000000000000000002040200004480000000000000000f90615f87a94c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2f842a0e1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109ca0000000000000000000000000a6439ca0fcba1d0f80df0be6a17220fed9c9038aa00000000000000000000000000000000000000000000000000214e8348c4f0000f89b94c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2f863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa0000000000000000000000000a6439ca0fcba1d0f80df0be6a17220fed9c9038aa000000000000000000000000088ad09518695c6c3712ac10a214be5109a655671a00000000000000000000000000000000000000000000000000214e8348c4f0000f9015c944c36d2919e407f0cc2ee3c993ccf8ac26d9ce64ef842a0482515ce3d9494a37ce83f18b72b363449458435fafdd7a53ddea7460fe01b58a0000500004ac82b41bd819dd871590b510316f2385cb196fb00000000000286bcb90100000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000b5000500004ac82b41bd819dd871590b510316f2385cb196fb00000000000286bc88ad09518695c6c3712ac10a214be5109a655671f6a78083ca3e2a662d6dd1703c939c8ace2e268d001e84800101000164125e4cfb000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000e39bd9e3af2054dd193b0d0217cfbd460f1049020000000000000000000000000000000000000000000000000214e8348c4f00000000000000000000000000f902dc94bae4ebbf42815bb9bc3720267ea4496277d60db8f842a0218247aabc759e65b5bb92ccc074f9d62cd187259f2a0984c3c9cf91f67ff7cfa0e22bf265e1b60d9ee57651054d617b61d3efef63f7bea6a0ab54d5391ed8c735b9028000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000001f9d000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000010000000000000000000000004c36d2919e407f0cc2ee3c993ccf8ac26d9ce64e00000000000000000000000075df5af045d91108662d8080fd1fefad6aa0bb59000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001e0000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000000b5000500004ac82b41bd819dd871590b510316f2385cb196fb00000000000286bc88ad09518695c6c3712ac10a214be5109a655671f6a78083ca3e2a662d6dd1703c939c8ace2e268d001e84800101000164125e4cfb000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000e39bd9e3af2054dd193b0d0217cfbd460f1049020000000000000000000000000000000000000000000000000214e8348c4f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000003a259a51d200d902ac25be2005d95eada6a1bfc5f8bc9488ad09518695c6c3712ac10a214be5109a655671f884a059a9a8027b9c87b961e254899821c9a276b5efc35d1f7409ea4f291470f1629aa0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2a0000000000000000000000000a6439ca0fcba1d0f80df0be6a17220fed9c9038aa0000500004ac82b41bd819dd871590b510316f2385cb196fb00000000000286bca00000000000000000000000000000000000000000000000000214e8348c4f0000",
]
const TX_INDEX = "0x4b"
const LOG_INDEX = 3
const BLOCK_NUMBER = 21580126
const BLOCK_NUMBER_PROOF = [
  "0x80c3c90100000000000000000000000000000000000000000000000000000000",
  "0x164baaa29f2301044470b20c32db9b16e4fa75a19e2a6b60af57f7cfa302db33",
  "0x25f3af4f24ae06e5bfd85ba2bea17ed99870a3f5aeca77ae1b7d8bff15199962",
  "0x924a7cf4d732f6f75c1dcc66298a590acc3c1e3e1a8f905405b0e260a8ac5bd9",
  "0xd8f9fdfdefd71ca5a5d2be6f59688271969a9b9c1e81cd858ed5ad9c3f72f025",
  "0xf2dd8d9427d95e201fde26698fc87b47347a42ab2aa047aead16407f0b0a4281",
  "0xb46f0c01805fe212e15907981b757e6c496b0cb06664224655613dcec82505bb",
  "0xdb56114e00fdd4c1f85c892bf35ac9a89289aaecb1ebd0a96cde606a748b5d71",
  "0x4d2102298b03409ce524c230974c8e8f714ad4335d9fb2a9aa07df53212ec4c1",
  "0x0000000000000000000000000000000000000000000000000000000000000000",
  "0xf5a5fd42d16a20302798ef6ed309979b43003d2320d9f0e8ea9831a92759fb4b",
  "0x03eb5d3665811443a3aa6250af430e14e18714095c6ed5f01b32cbb224e99f11",
  "0x0000000000000000000000000000000000000000000000000000000000000000",
  "0xf5a5fd42d16a20302798ef6ed309979b43003d2320d9f0e8ea9831a92759fb4b",
  "0x03eb5d3665811443a3aa6250af430e14e18714095c6ed5f01b32cbb224e99f11",
]
const BLOCK_HASH = "0x0c9afc17401bd6c83116e74db07fe0e6b5c98a2e2baa03b341dcacae39a6a7ba"
const BLOCK_HASH_PROOF = [
  "0xd044ee476f568d6d48980051406d362424c11c890f3d23c48264f167a3f8f98d",
  "0x19c7c280460442871d35b1938599152c5edf27aeaae66923e1f9dcbbb783a093",
  "0x905a9038982963bad0af4884b17e7bb07308f96be3c171cd4ed2118ada415ca4",
  "0x897af0ecef6a14030647a42c57b721ceacc9d77caa1fa40be1a7dcd499605874",
  "0xd8f9fdfdefd71ca5a5d2be6f59688271969a9b9c1e81cd858ed5ad9c3f72f025",
  "0xf2dd8d9427d95e201fde26698fc87b47347a42ab2aa047aead16407f0b0a4281",
  "0xb46f0c01805fe212e15907981b757e6c496b0cb06664224655613dcec82505bb",
  "0xdb56114e00fdd4c1f85c892bf35ac9a89289aaecb1ebd0a96cde606a748b5d71",
  "0x4d2102298b03409ce524c230974c8e8f714ad4335d9fb2a9aa07df53212ec4c1",
  "0x0000000000000000000000000000000000000000000000000000000000000000",
  "0xf5a5fd42d16a20302798ef6ed309979b43003d2320d9f0e8ea9831a92759fb4b",
  "0x03eb5d3665811443a3aa6250af430e14e18714095c6ed5f01b32cbb224e99f11",
  "0x0000000000000000000000000000000000000000000000000000000000000000",
  "0xf5a5fd42d16a20302798ef6ed309979b43003d2320d9f0e8ea9831a92759fb4b",
  "0x03eb5d3665811443a3aa6250af430e14e18714095c6ed5f01b32cbb224e99f11",
]

const setup = async () => {
  const signers = await ethers.getSigners()
  const admin = signers[0]
  const EthereumTrieDB = await ethers.getContractFactory("EthereumTrieDB")
  const ethereumTrieDB = await EthereumTrieDB.deploy()
  const MerklePatricia = await ethers.getContractFactory("MerklePatricia", {
    libraries: {
      EthereumTrieDB: ethereumTrieDB.address,
    },
  })
  const merklePatricia = await MerklePatricia.deploy()
  const SP1HeliosAdapter = await ethers.getContractFactory("SP1HeliosAdapter", {
    libraries: {
      MerklePatricia: merklePatricia.address,
    },
  })
  const MockSP1Helios = await ethers.getContractFactory("MockSP1Helios")
  const sp1Helios = await MockSP1Helios.deploy()
  const sp1HeliosAdapter = await SP1HeliosAdapter.deploy(sp1Helios.address, SOURCE_CHAIN_ID, YAHO_ADDRESS)

  return {
    admin,
    sp1Helios,
    sp1HeliosAdapter,
  }
}

describe("SP1HeliosAdapter", function () {
  describe("constructor", function () {
    it("Successfully deploys contract with correct state", async function () {
      const { sp1Helios, sp1HeliosAdapter } = await setup()
      expect(await sp1HeliosAdapter.SP1_HELIOS_ADDRESS()).to.equal(sp1Helios.address)
      expect(await sp1HeliosAdapter.SOURCE_CHAIN_ID()).to.equal(SOURCE_CHAIN_ID)
      expect(await sp1HeliosAdapter.SOURCE_YAHO()).to.equal(YAHO_ADDRESS)
    })
  })

  describe("verifyAndStoreDispatchedMessage()", function () {
    it("Successfully verifies a valid `MessageDispatched` event and stores hash", async function () {
      const { sp1Helios, sp1HeliosAdapter } = await setup()
      const setHeaderTx = await sp1Helios.setHeader(SOURCE_SLOT, VALID_BLOCK_ROOT)
      expect(setHeaderTx).to.emit(sp1Helios.address, "HeadUpdate").withArgs(SOURCE_SLOT, VALID_BLOCK_ROOT)
      const tx = await sp1HeliosAdapter.verifyAndStoreDispatchedMessage(
        SOURCE_SLOT,
        SLOT,
        RECEIPT_ROOT_PROOF,
        RECEIPT_ROOT,
        RECEIPT_PROOF,
        TX_INDEX,
        LOG_INDEX,
      )
      const expectedId = "102300351172944368967581048037513912832582585385136646442487813612557882148661"
      const expectedHash = "0x1defdce1a91193956fe019172f08c3f88c340c6472c678c8fc84f14e15643862"
      expect(tx).to.emit(sp1HeliosAdapter.address, "HashStored").withArgs(expectedId, expectedHash)
      expect(await sp1HeliosAdapter.getHash(SOURCE_CHAIN_ID, expectedId)).to.equal(expectedHash)
    })

    it("Revert with invalid block root", async function () {
      const { sp1Helios, sp1HeliosAdapter } = await setup()
      const INVALID_BLOCK_ROOT = "0x882a3ae01f50fbd2c1951593d5f171eea0ae2ff9006bfb74aa8564f9265f02e6"
      const setHeaderTx = await sp1Helios.setHeader(SOURCE_SLOT, INVALID_BLOCK_ROOT)
      expect(setHeaderTx).to.emit(sp1Helios.address, "HeadUpdate").withArgs(SOURCE_SLOT, INVALID_BLOCK_ROOT)
      await expect(
        sp1HeliosAdapter.verifyAndStoreDispatchedMessage(
          SOURCE_SLOT,
          SLOT,
          RECEIPT_ROOT_PROOF,
          RECEIPT_ROOT,
          RECEIPT_PROOF,
          TX_INDEX,
          LOG_INDEX,
        ),
      ).to.be.revertedWithCustomError(sp1HeliosAdapter, "InvalidReceiptsRoot")
    })

    it("Revert when block root is missing", async function () {
      const { sp1HeliosAdapter } = await setup()
      await expect(
        sp1HeliosAdapter.verifyAndStoreDispatchedMessage(
          SOURCE_SLOT,
          SLOT,
          RECEIPT_ROOT_PROOF,
          RECEIPT_ROOT,
          RECEIPT_PROOF,
          TX_INDEX,
          LOG_INDEX,
        ),
      ).to.be.revertedWithCustomError(sp1HeliosAdapter, "HeaderNotAvailable")
    })

    it("Revert with invalid receipt", async function () {
      const { sp1Helios, sp1HeliosAdapter } = await setup()
      await sp1Helios.setHeader(SOURCE_SLOT, VALID_BLOCK_ROOT)
      const INVALID_LOG_INDEX = 5
      await expect(
        sp1HeliosAdapter.verifyAndStoreDispatchedMessage(
          SOURCE_SLOT,
          SLOT,
          RECEIPT_ROOT_PROOF,
          RECEIPT_ROOT,
          RECEIPT_PROOF,
          TX_INDEX,
          INVALID_LOG_INDEX,
        ),
      ).to.be.revertedWithCustomError(sp1HeliosAdapter, "ErrorParseReceipt")
    })
  })

  describe("storeBlockHeader()", function () {
    it("Successfully store block header", async function () {
      const { sp1Helios, sp1HeliosAdapter } = await setup()
      const setHeaderTx = await sp1Helios.setHeader(SOURCE_SLOT, VALID_BLOCK_ROOT)
      expect(setHeaderTx).to.emit(sp1Helios.address, "HeadUpdate").withArgs(SOURCE_SLOT, VALID_BLOCK_ROOT)
      const tx = await sp1HeliosAdapter.storeBlockHeader(
        SOURCE_SLOT,
        BLOCK_NUMBER,
        BLOCK_NUMBER_PROOF,
        BLOCK_HASH,
        BLOCK_HASH_PROOF,
      )
      expect(tx).to.emit(sp1HeliosAdapter.address, "HashStored").withArgs(BLOCK_NUMBER, BLOCK_HASH)
      expect(await sp1HeliosAdapter.getHash(SOURCE_CHAIN_ID, BLOCK_NUMBER)).to.equal(BLOCK_HASH)
    })

    it("Revert with invalid block number proof", async function () {
      const { sp1Helios, sp1HeliosAdapter } = await setup()
      await sp1Helios.setHeader(SOURCE_SLOT, VALID_BLOCK_ROOT)
      const INVALID_BLOCK_NUMBER = 123456
      await expect(
        sp1HeliosAdapter.storeBlockHeader(
          SOURCE_SLOT,
          INVALID_BLOCK_NUMBER,
          BLOCK_NUMBER_PROOF,
          BLOCK_HASH,
          BLOCK_HASH_PROOF,
        ),
      ).to.be.revertedWithCustomError(sp1HeliosAdapter, "InvalidBlockNumberProof")
    })

    it("Revert with invalid block hash proof", async function () {
      const { sp1Helios, sp1HeliosAdapter } = await setup()
      await sp1Helios.setHeader(SOURCE_SLOT, VALID_BLOCK_ROOT)
      const INVALID_BLOCK_HASH = "0x009afc17401bd6c83116e74db07fe0e6b5c98a2e2baa03b341dcacae39a6a7ba"
      await expect(
        sp1HeliosAdapter.storeBlockHeader(
          SOURCE_SLOT,
          BLOCK_NUMBER,
          BLOCK_NUMBER_PROOF,
          INVALID_BLOCK_HASH,
          BLOCK_HASH_PROOF,
        ),
      ).to.be.revertedWithCustomError(sp1HeliosAdapter, "InvalidBlockHashProof")
    })
  })
})
