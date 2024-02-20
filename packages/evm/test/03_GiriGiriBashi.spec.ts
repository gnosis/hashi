import { expect } from "chai"
import { ethers, network } from "hardhat"

const DOMAIN_ID = 1
const HASH_ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000"
const HASH_GOOD = "0x0000000000000000000000000000000000000000000000000000000000000001"
const HASH_BAD = "0x0000000000000000000000000000000000000000000000000000000000000bad"
const HASH_DEAD = "0x000000000000000000000000000000000000000000000000000000000000dead"
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000"
const LIST_END = "0x0000000000000000000000000000000000000001"
const ADDRESS_TWO = "0x0000000000000000000000000000000000000002"
const ADDRESS_THREE = "0x0000000000000000000000000000000000000003"
const CHALLENGE_RANGE = 20
const BOND = ethers.utils.parseEther("1")

function compareAddresses(a: string, b: string): number {
  // Remove the "0x" prefix and convert to lowercase for comparison
  const addressA = a.toLowerCase().replace("0x", "")
  const addressB = b.toLowerCase().replace("0x", "")

  if (addressA < addressB) {
    return -1
  } else if (addressA > addressB) {
    return 1
  } else {
    return 0
  }
}

const setup = async (_configs?: any) => {
  const [wallet] = await ethers.getSigners()
  const Hashi = await ethers.getContractFactory("Hashi")
  const hashi = await Hashi.deploy()
  const GiriGiriBashi = await ethers.getContractFactory("GiriGiriBashi")
  const giriGiriBashi = await GiriGiriBashi.deploy(wallet.address, hashi.address, ADDRESS_TWO)
  const MockAdapter = await ethers.getContractFactory("MockAdapter")
  const mockAdapter = await MockAdapter.deploy()
  const secondMockAdapter = await MockAdapter.deploy()
  const thirdMockAdapter = await MockAdapter.deploy()

  await mockAdapter.setHashes(DOMAIN_ID, [0, 1, 20, 21, 22], [HASH_ZERO, HASH_GOOD, HASH_BAD, HASH_GOOD, HASH_BAD])
  await secondMockAdapter.setHashes(
    DOMAIN_ID,
    [0, 1, 20, 21, 22],
    [HASH_ZERO, HASH_GOOD, HASH_GOOD, HASH_GOOD, HASH_GOOD],
  )
  await thirdMockAdapter.setHashes(
    DOMAIN_ID,
    [0, 1, 20, 21, 22],
    [HASH_ZERO, HASH_GOOD, HASH_DEAD, HASH_GOOD, HASH_GOOD],
  )

  await giriGiriBashi.setChallengeRange(DOMAIN_ID, CHALLENGE_RANGE)

  const settings = {
    quarantined: false,
    minimumBond: BOND,
    startId: 1,
    idDepth: 20,
    timeout: 500,
  }

  return {
    giriGiriBashi,
    GiriGiriBashi,
    hashi,
    mockAdapter,
    secondMockAdapter,
    settings,
    thirdMockAdapter,
    wallet,
  }
}

describe("GiriGiriBashi", function () {
  describe("Deploy", function () {
    it("Successfully deploys contract", async function () {
      const { hashi, giriGiriBashi, wallet } = await setup()
      expect(await giriGiriBashi.deployed())
      expect(await giriGiriBashi.owner()).to.equal(wallet.address)
      expect(await giriGiriBashi.hashi()).to.equal(hashi.address)
      expect(await giriGiriBashi.bondRecipient()).to.equal(ADDRESS_TWO)
    })
    it("Emits Initialized event", async function () {
      const { giriGiriBashi } = await setup()
      const event = await giriGiriBashi.filters.Init(null, null)
      await expect(event.address).to.equal(giriGiriBashi.address)
    })
  })

  describe("setHashi()", function () {
    it("Reverts if called after initializing", async function () {
      const { giriGiriBashi, wallet } = await setup()
      await giriGiriBashi.transferOwnership(giriGiriBashi.address)
      await expect(giriGiriBashi.setHashi(wallet.address)).to.be.revertedWith(
        "Initializable: contract is not initializing",
      )
    })
    it("Sets Hashi address", async function () {
      const { giriGiriBashi, hashi } = await setup()
      expect(await giriGiriBashi.hashi()).to.equal(hashi.address)
    })
    it("Emits HashiSet() event", async function () {
      const { giriGiriBashi, hashi } = await setup()
      const tx = await giriGiriBashi.deployTransaction
      await expect(tx).to.emit(giriGiriBashi, "HashiSet").withArgs(hashi.address)
    })
  })

  describe("setThreshold()", function () {
    it("Reverts if count is greater than zero", async function () {
      const { giriGiriBashi, mockAdapter, settings } = await setup()
      await giriGiriBashi.enableAdapters(DOMAIN_ID, [mockAdapter.address], [settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)
      await expect(giriGiriBashi.setThreshold(DOMAIN_ID, 2)).to.be.revertedWithCustomError(
        giriGiriBashi,
        "CountMustBeZero",
      )
    })
    it("Reverts if adapters are not enabled", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.setThreshold(DOMAIN_ID, 2)).to.be.revertedWithCustomError(
        giriGiriBashi,
        "CountCannotBeZero",
      )
    })
    it("Reverts if the threshold is less than them majority of adapters", async function () {
      const { giriGiriBashi, settings, mockAdapter, secondMockAdapter, thirdMockAdapter } = await setup()
      await giriGiriBashi.enableAdapters(
        DOMAIN_ID,
        [mockAdapter.address, secondMockAdapter.address, thirdMockAdapter.address],
        [settings, settings, settings],
      )
      await expect(giriGiriBashi.setThreshold(DOMAIN_ID, 1))
        .to.be.revertedWithCustomError(giriGiriBashi, "InvalidThreshold")
        .withArgs(1)
    })
    it("Sets threshold for the given ChainID", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, settings } = await setup()
      await giriGiriBashi.enableAdapters(
        DOMAIN_ID,
        [mockAdapter.address, secondMockAdapter.address],
        [settings, settings],
      )
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)
      expect((await giriGiriBashi.domains(DOMAIN_ID)).threshold).to.equal(2)
    })
    it("Emits HashiSet() event", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, settings } = await setup()
      await giriGiriBashi.enableAdapters(
        DOMAIN_ID,
        [mockAdapter.address, secondMockAdapter.address],
        [settings, settings],
      )
      await expect(giriGiriBashi.setThreshold(DOMAIN_ID, 2))
        .to.emit(giriGiriBashi, "ThresholdSet")
        .withArgs(DOMAIN_ID, 2)
    })
  })

  describe("enableAdapters()", function () {
    it("Reverts if called by non-owner account", async function () {
      const { giriGiriBashi, settings } = await setup()
      await giriGiriBashi.transferOwnership(giriGiriBashi.address)
      await expect(giriGiriBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO], [settings])).to.be.revertedWith(
        "Ownable: caller is not the owner",
      )
    })
    it("Reverts if any adapters are already enabled", async function () {
      const { giriGiriBashi, settings } = await setup()
      await giriGiriBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO], [settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 1)
      await expect(giriGiriBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO], [settings])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "CountMustBeZero",
      )
    })
    it("Reverts if arrays are unequal lengths", async function () {
      const { giriGiriBashi, settings } = await setup()
      await expect(
        giriGiriBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO], [settings, settings]),
      ).to.be.revertedWithCustomError(giriGiriBashi, "UnequalArrayLengths")
    })
    it("Enables the given adapters", async function () {
      const { giriGiriBashi, settings } = await setup()
      await giriGiriBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE], [settings, settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)
      const adapters = await giriGiriBashi.getAdapters(DOMAIN_ID)
      await expect(adapters[0]).to.equal(ADDRESS_TWO)
      await expect(adapters[1]).to.equal(ADDRESS_THREE)
      expect((await giriGiriBashi.adapters(DOMAIN_ID, LIST_END)).next).to.equal(ADDRESS_TWO)
      expect((await giriGiriBashi.adapters(DOMAIN_ID, LIST_END)).previous).to.equal(ADDRESS_THREE)
      expect((await giriGiriBashi.adapters(DOMAIN_ID, ADDRESS_TWO)).next).to.equal(ADDRESS_THREE)
      expect((await giriGiriBashi.adapters(DOMAIN_ID, ADDRESS_TWO)).previous).to.equal(LIST_END)
      expect((await giriGiriBashi.adapters(DOMAIN_ID, ADDRESS_THREE)).next).to.equal(LIST_END)
      expect((await giriGiriBashi.adapters(DOMAIN_ID, ADDRESS_THREE)).previous).to.equal(ADDRESS_TWO)
      let adapterSettings = await giriGiriBashi.settings(DOMAIN_ID, ADDRESS_TWO)
      expect(adapterSettings.quarantined).to.deep.equal(settings.quarantined)
      expect(adapterSettings.minimumBond).to.deep.equal(settings.minimumBond)
      expect(adapterSettings.startId).to.deep.equal(settings.startId)
      expect(adapterSettings.idDepth).to.deep.equal(settings.idDepth)
      expect(adapterSettings.timeout).to.deep.equal(settings.timeout)
      adapterSettings = await giriGiriBashi.settings(DOMAIN_ID, ADDRESS_THREE)
      expect(adapterSettings.quarantined).to.deep.equal(settings.quarantined)
      expect(adapterSettings.minimumBond).to.deep.equal(settings.minimumBond)
      expect(adapterSettings.startId).to.deep.equal(settings.startId)
      expect(adapterSettings.idDepth).to.deep.equal(settings.idDepth)
      expect(adapterSettings.timeout).to.deep.equal(settings.timeout)
    })
    it("Emits AdaptersEnabled() event", async function () {
      const { giriGiriBashi, settings } = await setup()
      await expect(giriGiriBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE], [settings, settings]))
        .to.emit(giriGiriBashi, "AdaptersEnabled")
        .withArgs(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
    })
  })

  describe("disableAdapters()", function () {
    it("Reverts if a state of no confidence has not been established", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.disableAdapters(DOMAIN_ID, [ADDRESS_TWO])).to.be.revertedWithCustomError(
        giriGiriBashi,
        "NoConfidenceRequired",
      )
    })
    it("Disables the given adapters", async function () {
      const { giriGiriBashi, settings } = await setup()
      await giriGiriBashi.enableAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE], [settings, settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, ethers.constants.MaxUint256)
      await giriGiriBashi.disableAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      const adapters = await giriGiriBashi.getAdapters(DOMAIN_ID)
      await expect(adapters[0]).to.equal(undefined)
    })
  })

  describe("getUnanimousHash()", function () {
    it("Updates head for given domain", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, settings } = await setup()
      await giriGiriBashi.enableAdapters(
        DOMAIN_ID,
        [mockAdapter.address, secondMockAdapter.address],
        [settings, settings],
      )
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)
      const oldHead = await giriGiriBashi.heads(DOMAIN_ID)
      await giriGiriBashi.getUnanimousHash(DOMAIN_ID, 1)
      const newHead = await giriGiriBashi.heads(DOMAIN_ID)
      expect(newHead).not.to.equal(oldHead)
    })
  })

  describe("getThresholdHash()", function () {
    for (let threshold = 2; threshold <= 3; threshold++) {
      it(`Updates head for given domain with ${threshold}/3`, async function () {
        const { giriGiriBashi, mockAdapter, secondMockAdapter, thirdMockAdapter, settings } = await setup()
        await giriGiriBashi.enableAdapters(
          DOMAIN_ID,
          [mockAdapter.address, secondMockAdapter.address, thirdMockAdapter.address],
          [settings, settings, settings],
        )
        await giriGiriBashi.setThreshold(DOMAIN_ID, threshold)
        const oldHead = await giriGiriBashi.heads(DOMAIN_ID)
        expect(await giriGiriBashi.callStatic.getThresholdHash(DOMAIN_ID, 1)).to.equal(HASH_GOOD)
        await giriGiriBashi.getThresholdHash(DOMAIN_ID, 1)
        const newHead = await giriGiriBashi.heads(DOMAIN_ID)
        expect(newHead).not.to.equal(oldHead)
      })
    }
  })

  describe("getHash()", function () {
    it("Updates head for given domain", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, settings } = await setup()
      await giriGiriBashi.enableAdapters(
        DOMAIN_ID,
        [mockAdapter.address, secondMockAdapter.address],
        [settings, settings],
      )
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)
      let adapters
      if (secondMockAdapter.address > mockAdapter.address) {
        adapters = [mockAdapter.address, secondMockAdapter.address]
      } else {
        adapters = [secondMockAdapter.address, mockAdapter.address]
      }
      const oldHead = await giriGiriBashi.heads(DOMAIN_ID)
      await giriGiriBashi.getHash(DOMAIN_ID, 1, adapters)
      const newHead = await giriGiriBashi.heads(DOMAIN_ID)
      expect(newHead).not.to.equal(oldHead)
    })
  })

  describe("challengeAdapter()", function () {
    it("Reverts if given adapter is not enabled", async function () {
      const { giriGiriBashi, mockAdapter } = await setup()
      await expect(giriGiriBashi.challengeAdapter(DOMAIN_ID, 1, mockAdapter.address))
        .to.be.revertedWithCustomError(giriGiriBashi, "AdapterNotEnabled")
        .withArgs(mockAdapter.address)
    })
    it("Reverts if value is less than minimum bond", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, settings } = await setup()
      await giriGiriBashi.enableAdapters(
        DOMAIN_ID,
        [mockAdapter.address, secondMockAdapter.address],
        [settings, settings],
      )
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)
      await expect(giriGiriBashi.challengeAdapter(DOMAIN_ID, 1, mockAdapter.address))
        .to.be.revertedWithCustomError(giriGiriBashi, "NotEnoughValue")
        .withArgs(mockAdapter.address, 0)
    })
    it("Reverts if adapter is already quarantined", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, settings } = await setup()
      const adapters = [mockAdapter.address, secondMockAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableAdapters(DOMAIN_ID, adapters, [settings, settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)

      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head - CHALLENGE_RANGE + 2
      await giriGiriBashi.challengeAdapter(DOMAIN_ID, challengeBlock, mockAdapter.address, {
        value: BOND,
      })
      const challengeId = await giriGiriBashi.getChallengeId(DOMAIN_ID, challengeBlock, mockAdapter.address)
      const challenge = await giriGiriBashi.challenges(challengeId)
      const increaseAmount = challenge.timestamp.add(settings.timeout).add(1)

      await network.provider.send("evm_setNextBlockTimestamp", [increaseAmount.toHexString()])

      await giriGiriBashi.resolveChallenge(DOMAIN_ID, challengeBlock, mockAdapter.address, [secondMockAdapter.address])
      await expect(
        giriGiriBashi.callStatic.challengeAdapter(DOMAIN_ID, challengeBlock, mockAdapter.address, {
          value: BOND,
        }),
      )
        .to.be.revertedWithCustomError(giriGiriBashi, "AlreadyQuarantined")
        .withArgs(mockAdapter.address)
    })
    it("Reverts if adapters array contains duplicates", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, settings } = await setup()
      const adapters = [mockAdapter.address, secondMockAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableAdapters(DOMAIN_ID, adapters, [settings, settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)

      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head - CHALLENGE_RANGE + 2
      await giriGiriBashi.challengeAdapter(DOMAIN_ID, challengeBlock, mockAdapter.address, {
        value: BOND,
      })
      const challengeId = await giriGiriBashi.getChallengeId(DOMAIN_ID, challengeBlock, mockAdapter.address)
      const challenge = await giriGiriBashi.challenges(challengeId)
      const increaseAmount = challenge.timestamp.add(settings.timeout).add(1)

      await network.provider.send("evm_setNextBlockTimestamp", [increaseAmount.toHexString()])
      await mockAdapter.setHashes(DOMAIN_ID, [challengeBlock], [HASH_GOOD])
      await secondMockAdapter.setHashes(DOMAIN_ID, [challengeBlock], [HASH_GOOD])

      await expect(
        giriGiriBashi.resolveChallenge(DOMAIN_ID, challengeBlock, mockAdapter.address, [
          secondMockAdapter.address,
          secondMockAdapter.address,
        ]),
      ).to.be.revertedWithCustomError(giriGiriBashi, "DuplicateOrOutOfOrderAdapters")
    })
    it("Reverts if adapters array contains the challenged adapter", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, settings } = await setup()
      const adapters = [mockAdapter.address, secondMockAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableAdapters(DOMAIN_ID, adapters, [settings, settings])

      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head - CHALLENGE_RANGE + 2
      await giriGiriBashi.challengeAdapter(DOMAIN_ID, challengeBlock, mockAdapter.address, {
        value: BOND,
      })

      const wrongAdapters = [secondMockAdapter.address, mockAdapter.address]
      await expect(giriGiriBashi.resolveChallenge(DOMAIN_ID, challengeBlock, mockAdapter.address, wrongAdapters))
        .to.revertedWithCustomError(giriGiriBashi, "AdaptersCannotContainChallengedAdapter")
        .withArgs(wrongAdapters, mockAdapter.address)
    })
    it("Reverts if duplicate challenge exists", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, settings } = await setup()
      const adapters = [mockAdapter.address, secondMockAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableAdapters(DOMAIN_ID, adapters, [settings, settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)
      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      expect(
        await giriGiriBashi.challengeAdapter(DOMAIN_ID, head - CHALLENGE_RANGE + 1, mockAdapter.address, {
          value: BOND,
        }),
      )
      await expect(
        giriGiriBashi.callStatic.challengeAdapter(DOMAIN_ID, head - CHALLENGE_RANGE + 1, mockAdapter.address, {
          value: BOND,
        }),
      ).to.be.revertedWithCustomError(giriGiriBashi, "DuplicateChallenge")
    })
    it("Reverts if challenge is out of range", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, settings } = await setup()
      const adapters = [mockAdapter.address, secondMockAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableAdapters(DOMAIN_ID, adapters, [settings, settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)
      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)

      // revert on block before start ID
      await expect(giriGiriBashi.callStatic.challengeAdapter(DOMAIN_ID, 0, mockAdapter.address, { value: BOND }))
        .to.be.revertedWithCustomError(giriGiriBashi, "OutOfRange")
        .withArgs(mockAdapter.address, 0)

      // revert on block too far in the future
      const outOfRangeBlock = head + CHALLENGE_RANGE + 1
      await expect(
        giriGiriBashi.callStatic.challengeAdapter(DOMAIN_ID, outOfRangeBlock, mockAdapter.address, {
          value: BOND,
        }),
      )
        .to.be.revertedWithCustomError(giriGiriBashi, "OutOfRange")
        .withArgs(mockAdapter.address, outOfRangeBlock)

      // revert on block too deep for adapter
      const tooDeepBlock = 1
      await expect(
        giriGiriBashi.callStatic.challengeAdapter(DOMAIN_ID, tooDeepBlock, mockAdapter.address, {
          value: BOND,
        }),
      )
        .to.be.revertedWithCustomError(giriGiriBashi, "OutOfRange")
        .withArgs(mockAdapter.address, tooDeepBlock)

      // make sure it can actually be successful / doesn't always revert
      expect(
        await giriGiriBashi.challengeAdapter(DOMAIN_ID, head - CHALLENGE_RANGE + 1, mockAdapter.address, {
          value: BOND,
        }),
      )
    })
    it("Creates a challenge for the given adapter", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, settings } = await setup()
      const adapters = [mockAdapter.address, secondMockAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableAdapters(DOMAIN_ID, adapters, [settings, settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)

      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      expect(
        await giriGiriBashi.challengeAdapter(DOMAIN_ID, head - CHALLENGE_RANGE + 1, mockAdapter.address, {
          value: BOND,
        }),
      )
    })
    it("Emits the ChallengeCreated event", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, settings } = await setup()
      const adapters = [mockAdapter.address, secondMockAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableAdapters(DOMAIN_ID, adapters, [settings, settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)
      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)

      await expect(
        giriGiriBashi.challengeAdapter(DOMAIN_ID, head - CHALLENGE_RANGE + 1, mockAdapter.address, {
          value: BOND,
        }),
      ).to.emit(giriGiriBashi, "ChallengeCreated")
    })
  })

  describe("resolveChallenge()", function () {
    it("Reverts if challenge is not found", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter } = await setup()
      await expect(
        giriGiriBashi.callStatic.resolveChallenge(DOMAIN_ID, 5, mockAdapter.address, [secondMockAdapter.address]),
      ).to.be.revertedWithCustomError(giriGiriBashi, "ChallengeNotFound")
    })
    it("Reverts if adapter has not yet timed out", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, settings } = await setup()
      const adapters = [mockAdapter.address, secondMockAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableAdapters(DOMAIN_ID, adapters, [settings, settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)

      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head - CHALLENGE_RANGE + 1
      await giriGiriBashi.challengeAdapter(DOMAIN_ID, challengeBlock, mockAdapter.address, {
        value: BOND,
      })
      const challengeId = await giriGiriBashi.getChallengeId(DOMAIN_ID, challengeBlock, mockAdapter.address)
      const challenge = await giriGiriBashi.challenges(challengeId)
      const increaseAmount = challenge.timestamp.add(settings.timeout).sub(1)

      await network.provider.send("evm_setNextBlockTimestamp", [increaseAmount.toHexString()])

      await expect(
        giriGiriBashi.resolveChallenge(DOMAIN_ID, challengeBlock, mockAdapter.address, [secondMockAdapter.address]),
      ).to.be.revertedWithCustomError(giriGiriBashi, "AdapterHasNotYetTimedOut")
    })
    it("Quarantines adapter and returns bond if adapter times out", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, settings, wallet } = await setup()
      const adapters = [mockAdapter.address, secondMockAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableAdapters(DOMAIN_ID, adapters, [settings, settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)
      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head - CHALLENGE_RANGE + 1

      await giriGiriBashi.challengeAdapter(DOMAIN_ID, challengeBlock, mockAdapter.address, {
        value: BOND,
      })
      const challengeId = await giriGiriBashi.getChallengeId(DOMAIN_ID, challengeBlock, mockAdapter.address)
      const challenge = await giriGiriBashi.challenges(challengeId)
      const increaseAmount = challenge.timestamp.add(settings.timeout).add(1)

      await network.provider.send("evm_setNextBlockTimestamp", [increaseAmount.toHexString()])

      const previousBalance = await ethers.provider.getBalance(wallet.address)

      await giriGiriBashi.resolveChallenge(DOMAIN_ID, challengeBlock, mockAdapter.address, [secondMockAdapter.address])

      const newBalance = await ethers.provider.getBalance(wallet.address)
      await expect(newBalance).to.be.greaterThan(previousBalance)

      const quarantined = (await giriGiriBashi.settings(DOMAIN_ID, mockAdapter.address)).quarantined
      await expect(quarantined).to.equal(true)
    })
    it("Keeps bond if _adapters + adapter equals threshold and agree", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, settings } = await setup()
      const adapters = [mockAdapter.address, secondMockAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableAdapters(DOMAIN_ID, adapters, [settings, settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)

      await giriGiriBashi.getHash(DOMAIN_ID, 1, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head.add(20)
      await giriGiriBashi.challengeAdapter(DOMAIN_ID, challengeBlock, mockAdapter.address, {
        value: BOND,
      })

      const balanceBefore = await ethers.provider.getBalance(ADDRESS_TWO)
      await giriGiriBashi.resolveChallenge(DOMAIN_ID, challengeBlock, mockAdapter.address, [secondMockAdapter.address])
      expect(await ethers.provider.getBalance(ADDRESS_TWO)).to.equal(balanceBefore.add(BOND))
      const quarantined = (await giriGiriBashi.settings(DOMAIN_ID, mockAdapter.address)).quarantined
      expect(quarantined).to.equal(false)
    })
    it("Reverts if _adapters + adapter equals threshold and disagree", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, settings, hashi } = await setup()
      const adapters = [mockAdapter.address, secondMockAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableAdapters(DOMAIN_ID, adapters, [settings, settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)

      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head.add(1)
      await giriGiriBashi.challengeAdapter(DOMAIN_ID, challengeBlock, mockAdapter.address, {
        value: BOND,
      })

      await expect(
        giriGiriBashi.resolveChallenge(DOMAIN_ID, challengeBlock, mockAdapter.address, [secondMockAdapter.address]),
      )
        .to.be.revertedWithCustomError(hashi, "AdaptersDisagree")
        .withArgs(mockAdapter.address, secondMockAdapter.address)
    })
    it("Keeps bond if canonical hash matches hash reported by challenged adapter", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, thirdMockAdapter, settings } = await setup()
      let adapters = [mockAdapter.address, secondMockAdapter.address, thirdMockAdapter.address]
      await giriGiriBashi.enableAdapters(DOMAIN_ID, adapters, [settings, settings, settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)
      adapters = adapters.sort(compareAddresses)

      await giriGiriBashi.getHash(DOMAIN_ID, 1, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head.add(20)
      await giriGiriBashi.challengeAdapter(DOMAIN_ID, challengeBlock, mockAdapter.address, {
        value: BOND,
      })

      const previousBalance = await ethers.provider.getBalance(ADDRESS_TWO)

      await giriGiriBashi.resolveChallenge(
        DOMAIN_ID,
        challengeBlock,
        mockAdapter.address,
        [secondMockAdapter.address, thirdMockAdapter.address].sort(compareAddresses),
      )
      expect(await ethers.provider.getBalance(ADDRESS_TWO)).to.equal(previousBalance.add(BOND))
      const quarantined = (await giriGiriBashi.settings(DOMAIN_ID, mockAdapter.address)).quarantined
      expect(quarantined).to.equal(false)
    })
    it("Quarantines adapter and returns bond if challenged adapter disagrees with canonical hash", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, thirdMockAdapter, settings } = await setup()
      let adapters = [mockAdapter.address, secondMockAdapter.address, thirdMockAdapter.address]
      await giriGiriBashi.enableAdapters(DOMAIN_ID, adapters, [settings, settings, settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)
      adapters = adapters.sort(compareAddresses)

      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head.add(1)
      await giriGiriBashi.challengeAdapter(DOMAIN_ID, challengeBlock, mockAdapter.address, {
        value: BOND,
      })

      await giriGiriBashi.resolveChallenge(
        DOMAIN_ID,
        challengeBlock,
        mockAdapter.address,
        [secondMockAdapter.address, thirdMockAdapter.address].sort(compareAddresses),
      )
      const quarantined = (await giriGiriBashi.settings(DOMAIN_ID, mockAdapter.address)).quarantined
      await expect(quarantined).to.equal(true)
    })
    it("Clears state after challenge is resolved", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, thirdMockAdapter, settings } = await setup()
      let adapters = [mockAdapter.address, secondMockAdapter.address, thirdMockAdapter.address]
      await giriGiriBashi.enableAdapters(DOMAIN_ID, adapters, [settings, settings, settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)
      adapters = adapters.sort(compareAddresses)

      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head.add(1)
      await giriGiriBashi.challengeAdapter(DOMAIN_ID, challengeBlock, mockAdapter.address, {
        value: BOND,
      })

      await giriGiriBashi.resolveChallenge(
        DOMAIN_ID,
        challengeBlock,
        mockAdapter.address,
        [secondMockAdapter.address, thirdMockAdapter.address].sort(compareAddresses),
      )
      const quarantined = (await giriGiriBashi.settings(DOMAIN_ID, mockAdapter.address)).quarantined
      expect(quarantined).to.equal(true)
      const challengeId = await giriGiriBashi.getChallengeId(DOMAIN_ID, challengeBlock, mockAdapter.address)
      const challenge = await giriGiriBashi.challenges(challengeId)
      expect(challenge.challenger).to.equal(ADDRESS_ZERO)
      expect(challenge.timestamp).to.equal(0)
      expect(challenge.bond).to.equal(0)
    })
    it("Emits ChallengeResolved() event", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, thirdMockAdapter, settings, wallet } = await setup()
      const adapters = [mockAdapter.address, secondMockAdapter.address, thirdMockAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableAdapters(DOMAIN_ID, adapters, [settings, settings, settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)

      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head.add(1)
      await giriGiriBashi.challengeAdapter(DOMAIN_ID, challengeBlock, mockAdapter.address, {
        value: BOND,
      })

      const challengeId = await giriGiriBashi.getChallengeId(DOMAIN_ID, challengeBlock, mockAdapter.address)
      await expect(
        giriGiriBashi.resolveChallenge(
          DOMAIN_ID,
          challengeBlock,
          mockAdapter.address,
          [secondMockAdapter.address, thirdMockAdapter.address].sort(compareAddresses),
        ),
      )
        .to.emit(giriGiriBashi, "ChallengeResolved")
        .withArgs(challengeId, DOMAIN_ID, challengeBlock, mockAdapter.address, wallet.address, BOND, true)
    })
  })

  describe("declareNoConfidence()", function () {
    it("Reverts if too few adapters were provided to prove no confidence", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, thirdMockAdapter, settings } = await setup()
      const adapters = [mockAdapter.address, secondMockAdapter.address, thirdMockAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableAdapters(DOMAIN_ID, adapters, [settings, settings, settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)
      await expect(giriGiriBashi.callStatic.declareNoConfidence(DOMAIN_ID, 20, [mockAdapter.address]))
        .to.be.revertedWithCustomError(giriGiriBashi, "CannotProveNoConfidence")
        .withArgs(DOMAIN_ID, 20, [mockAdapter.address])
    })
    it("Reverts if any of the provided adapters agree", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, thirdMockAdapter, settings } = await setup()
      const adapters = [mockAdapter.address, secondMockAdapter.address, thirdMockAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableAdapters(DOMAIN_ID, adapters, [settings, settings, settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)
      await expect(giriGiriBashi.callStatic.declareNoConfidence(DOMAIN_ID, 22, adapters)).to.be.revertedWithCustomError(
        giriGiriBashi,
        "AdaptersAgreed",
      )
    })
    it("Clears state for domain", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, thirdMockAdapter, settings } = await setup()
      const adapters = [mockAdapter.address, secondMockAdapter.address, thirdMockAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableAdapters(DOMAIN_ID, adapters, [settings, settings, settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)
      expect(await giriGiriBashi.declareNoConfidence(DOMAIN_ID, 20, adapters))
      const domain = await giriGiriBashi.domains(DOMAIN_ID)
      const challengeRange = await giriGiriBashi.challengeRanges(DOMAIN_ID)
      expect(domain.threshold).to.equal(ethers.constants.MaxUint256)
      expect(challengeRange).to.equal(0)
    })
    it("Emits NoConfidenceDeclared() event", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, thirdMockAdapter, settings } = await setup()
      const adapters = [mockAdapter.address, secondMockAdapter.address, thirdMockAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableAdapters(DOMAIN_ID, adapters, [settings, settings, settings])
      await expect(giriGiriBashi.declareNoConfidence(DOMAIN_ID, 20, adapters))
        .to.emit(giriGiriBashi, "NoConfidenceDeclared")
        .withArgs(DOMAIN_ID)
    })
  })

  describe("getChallengeId()", function () {
    it("Returns the correct challangeId", async function () {
      const { giriGiriBashi } = await setup()
      const expectedChallengeId = ethers.utils.solidityKeccak256(
        ["uint256", "uint256", "address"],
        [DOMAIN_ID, 1, ADDRESS_TWO],
      )
      const reportedChallengeId = await giriGiriBashi.getChallengeId(DOMAIN_ID, 1, ADDRESS_TWO)
      expect(expectedChallengeId).to.equal(reportedChallengeId)
    })
  })

  describe("setChallengeRange()", function () {
    it("Reverts if challengeRange has already been set for given domain", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.callStatic.setChallengeRange(DOMAIN_ID, CHALLENGE_RANGE))
        .to.be.revertedWithCustomError(giriGiriBashi, "ChallengeRangeAlreadySet")
        .withArgs(DOMAIN_ID)
    })
    it("Sets challenge range for given domain", async function () {
      const { giriGiriBashi } = await setup()
      expect(await giriGiriBashi.setChallengeRange(2, CHALLENGE_RANGE))
      const challengeRange = await giriGiriBashi.challengeRanges(2)
      expect(challengeRange).to.equal(CHALLENGE_RANGE)
    })
    it("Emits the ChallengeRangeUpdated event", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.setChallengeRange(2, CHALLENGE_RANGE))
        .to.emit(giriGiriBashi, "ChallengeRangeUpdated")
        .withArgs(2, CHALLENGE_RANGE)
    })
  })

  describe("replaceQuarantinedAdapters()", function () {
    it("Reverts if given arrays are unequal length", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, settings } = await setup()
      await giriGiriBashi.enableAdapters(
        DOMAIN_ID,
        [mockAdapter.address, secondMockAdapter.address],
        [settings, settings],
      )
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)
      await expect(
        giriGiriBashi.replaceQuarantinedAdapters(
          DOMAIN_ID,
          [mockAdapter.address, secondMockAdapter.address],
          [ADDRESS_ZERO],
          [settings, settings],
        ),
      ).to.be.revertedWithCustomError(giriGiriBashi, "UnequalArrayLengths")
      await expect(
        giriGiriBashi.replaceQuarantinedAdapters(
          DOMAIN_ID,
          [mockAdapter.address],
          [ADDRESS_ZERO, ADDRESS_ZERO],
          [settings, settings],
        ),
      ).to.be.revertedWithCustomError(giriGiriBashi, "UnequalArrayLengths")
      await expect(
        giriGiriBashi.replaceQuarantinedAdapters(
          DOMAIN_ID,
          [mockAdapter.address, secondMockAdapter.address],
          [ADDRESS_ZERO, ADDRESS_ZERO],
          [settings],
        ),
      ).to.be.revertedWithCustomError(giriGiriBashi, "UnequalArrayLengths")
    })
    it("Reverts if given adapter is not quarantined", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, settings } = await setup()
      await giriGiriBashi.enableAdapters(
        DOMAIN_ID,
        [mockAdapter.address, secondMockAdapter.address],
        [settings, settings],
      )
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)
      await expect(
        giriGiriBashi.replaceQuarantinedAdapters(
          DOMAIN_ID,
          [mockAdapter.address, secondMockAdapter.address],
          [ADDRESS_ZERO, ADDRESS_ZERO],
          [settings, settings],
        ),
      ).to.be.revertedWithCustomError(giriGiriBashi, "AdapterNotQuarantined")
    })
    it("Replaces adapters and initializes settings", async function () {
      const { giriGiriBashi, mockAdapter, secondMockAdapter, thirdMockAdapter, settings } = await setup()
      let adapters = [mockAdapter.address, secondMockAdapter.address, thirdMockAdapter.address]
      await giriGiriBashi.enableAdapters(DOMAIN_ID, adapters, [settings, settings, settings])
      await giriGiriBashi.setThreshold(DOMAIN_ID, 2)
      adapters = adapters.sort(compareAddresses)

      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head.add(1)
      await giriGiriBashi.challengeAdapter(DOMAIN_ID, challengeBlock, mockAdapter.address, {
        value: BOND,
      })

      await giriGiriBashi.resolveChallenge(
        DOMAIN_ID,
        challengeBlock,
        mockAdapter.address,
        [secondMockAdapter.address, thirdMockAdapter.address].sort(compareAddresses),
      )
      expect(
        await giriGiriBashi.replaceQuarantinedAdapters(DOMAIN_ID, [mockAdapter.address], [ADDRESS_TWO], [settings]),
      )
      const adapterSettings = await giriGiriBashi.settings(DOMAIN_ID, ADDRESS_TWO)
      expect(adapterSettings.quarantined).to.deep.equal(settings.quarantined)
      expect(adapterSettings.minimumBond).to.deep.equal(settings.minimumBond)
      expect(adapterSettings.startId).to.deep.equal(settings.startId)
      expect(adapterSettings.idDepth).to.deep.equal(settings.idDepth)
      expect(adapterSettings.timeout).to.deep.equal(settings.timeout)
    })
  })
})
