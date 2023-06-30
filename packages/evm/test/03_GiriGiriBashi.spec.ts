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

const setup = async () => {
  const [wallet] = await ethers.getSigners()
  const Hashi = await ethers.getContractFactory("Hashi")
  const hashi = await Hashi.deploy()
  const GiriGiriBashi = await ethers.getContractFactory("GiriGiriBashi")
  const giriGiriBashi = await GiriGiriBashi.deploy(wallet.address, hashi.address, ADDRESS_TWO)
  const MockOracleAdapter = await ethers.getContractFactory("MockOracleAdapter")
  const mockOracleAdapter = await MockOracleAdapter.deploy()
  const secondMockOracleAdapter = await MockOracleAdapter.deploy()
  const thirdMockOracleAdapter = await MockOracleAdapter.deploy()

  await mockOracleAdapter.setHashes(
    DOMAIN_ID,
    [0, 1, 20, 21, 22],
    [HASH_ZERO, HASH_GOOD, HASH_BAD, HASH_GOOD, HASH_BAD],
  )
  await secondMockOracleAdapter.setHashes(
    DOMAIN_ID,
    [0, 1, 20, 21, 22],
    [HASH_ZERO, HASH_GOOD, HASH_GOOD, HASH_GOOD, HASH_GOOD],
  )
  await thirdMockOracleAdapter.setHashes(
    DOMAIN_ID,
    [0, 1, 20, 21, 22],
    [HASH_ZERO, HASH_GOOD, HASH_DEAD, HASH_GOOD, HASH_GOOD],
  )
  await giriGiriBashi.setThreshold(DOMAIN_ID, 2)
  await giriGiriBashi.setChallengeRange(DOMAIN_ID, CHALLENGE_RANGE)

  const settings = {
    quarantined: false,
    minimumBond: BOND,
    startId: 1,
    idDepth: 20,
    timeout: 500,
  }

  return {
    wallet,
    hashi,
    GiriGiriBashi,
    giriGiriBashi,
    mockOracleAdapter,
    secondMockOracleAdapter,
    thirdMockOracleAdapter,
    settings,
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
      await expect(tx).to.emit(giriGiriBashi, "HashiSet").withArgs(giriGiriBashi.address, hashi.address)
    })
  })

  describe("setThreshold()", function () {
    it("Reverts if count is greater than zero", async function () {
      const { giriGiriBashi, mockOracleAdapter, settings } = await setup()
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [mockOracleAdapter.address], [settings])
      await expect(giriGiriBashi.setThreshold(DOMAIN_ID, 2)).to.be.revertedWithCustomError(
        giriGiriBashi,
        "CountMustBeZero",
      )
    })
    it("Sets threshold for the given ChainID", async function () {
      const { giriGiriBashi } = await setup()
      expect(await giriGiriBashi.setThreshold(DOMAIN_ID, 3))
      expect((await giriGiriBashi.domains(DOMAIN_ID)).threshold).to.equal(3)
    })
    it("Emits HashiSet() event", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.setThreshold(DOMAIN_ID, 3))
        .to.emit(giriGiriBashi, "ThresholdSet")
        .withArgs(giriGiriBashi.address, DOMAIN_ID, 3)
    })
  })

  describe("enableOracleAdapters()", function () {
    it("Reverts if called by non-owner account", async function () {
      const { giriGiriBashi, settings } = await setup()
      await giriGiriBashi.transferOwnership(giriGiriBashi.address)
      await expect(giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO], [settings])).to.be.revertedWith(
        "Ownable: caller is not the owner",
      )
    })
    it("Reverts if any adapters are already enabled", async function () {
      const { giriGiriBashi, settings } = await setup()
      await expect(giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO], [settings]))
      await expect(
        giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO], [settings]),
      ).to.be.revertedWithCustomError(giriGiriBashi, "CountMustBeZero")
    })
    it("Reverts if arrays are unequal lengths", async function () {
      const { giriGiriBashi, settings } = await setup()
      await expect(giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO], [settings, settings]))
        .to.be.revertedWithCustomError(giriGiriBashi, "UnequalArrayLengths")
        .withArgs(giriGiriBashi.address)
    })
    it("Enables the given oracles", async function () {
      const { giriGiriBashi, settings } = await setup()
      await expect(giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE], [settings, settings]))
      const adapters = await giriGiriBashi.getOracleAdapters(DOMAIN_ID)
      await expect(adapters[0]).to.equal(ADDRESS_TWO)
      await expect(adapters[1]).to.equal(ADDRESS_THREE)
      expect((await giriGiriBashi.adapters(DOMAIN_ID, LIST_END)).next).to.equal(ADDRESS_TWO)
      expect((await giriGiriBashi.adapters(DOMAIN_ID, LIST_END)).previous).to.equal(ADDRESS_THREE)
      expect((await giriGiriBashi.adapters(DOMAIN_ID, ADDRESS_TWO)).next).to.equal(ADDRESS_THREE)
      expect((await giriGiriBashi.adapters(DOMAIN_ID, ADDRESS_TWO)).previous).to.equal(LIST_END)
      expect((await giriGiriBashi.adapters(DOMAIN_ID, ADDRESS_THREE)).next).to.equal(LIST_END)
      expect((await giriGiriBashi.adapters(DOMAIN_ID, ADDRESS_THREE)).previous).to.equal(ADDRESS_TWO)
      let adapterSettings = await giriGiriBashi.settings(ADDRESS_TWO)
      expect(adapterSettings.quarantined).to.deep.equal(settings.quarantined)
      expect(adapterSettings.minimumBond).to.deep.equal(settings.minimumBond)
      expect(adapterSettings.startId).to.deep.equal(settings.startId)
      expect(adapterSettings.idDepth).to.deep.equal(settings.idDepth)
      expect(adapterSettings.timeout).to.deep.equal(settings.timeout)
      adapterSettings = await giriGiriBashi.settings(ADDRESS_THREE)
      expect(adapterSettings.quarantined).to.deep.equal(settings.quarantined)
      expect(adapterSettings.minimumBond).to.deep.equal(settings.minimumBond)
      expect(adapterSettings.startId).to.deep.equal(settings.startId)
      expect(adapterSettings.idDepth).to.deep.equal(settings.idDepth)
      expect(adapterSettings.timeout).to.deep.equal(settings.timeout)
    })
    it("Emits OracleAdaptersEnabled() event", async function () {
      const { giriGiriBashi, settings } = await setup()
      await expect(giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE], [settings, settings]))
        .to.emit(giriGiriBashi, "OracleAdaptersEnabled")
        .withArgs(giriGiriBashi.address, DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
    })
  })

  describe("disableOracleAdapters()", function () {
    it("Reverts if a state of no confidence has not been established", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.disableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO]))
        .to.be.revertedWithCustomError(giriGiriBashi, "NoConfidenceRequired")
        .withArgs(giriGiriBashi.address)
    })
    it("Disables the given oracles", async function () {
      const { giriGiriBashi, settings } = await setup()
      await giriGiriBashi.setThreshold(DOMAIN_ID, ethers.constants.MaxUint256)
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE], [settings, settings])
      await giriGiriBashi.disableOracleAdapters(DOMAIN_ID, [ADDRESS_TWO, ADDRESS_THREE])
      const adapters = await giriGiriBashi.getOracleAdapters(DOMAIN_ID)
      await expect(adapters[0]).to.equal(undefined)
    })
  })

  describe("getUnanimousHash()", function () {
    it("Updates head for given domain", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, settings } = await setup()
      await giriGiriBashi.enableOracleAdapters(
        DOMAIN_ID,
        [mockOracleAdapter.address, secondMockOracleAdapter.address],
        [settings, settings],
      )
      const oldHead = await giriGiriBashi.heads(DOMAIN_ID)
      await giriGiriBashi.getUnanimousHash(DOMAIN_ID, 1)
      const newHead = await giriGiriBashi.heads(DOMAIN_ID)
      expect(newHead).not.to.equal(oldHead)
    })
  })

  describe("getThresholdHash()", function () {
    it("Updates head for given domain", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, settings } = await setup()
      await giriGiriBashi.enableOracleAdapters(
        DOMAIN_ID,
        [mockOracleAdapter.address, secondMockOracleAdapter.address],
        [settings, settings],
      )
      const oldHead = await giriGiriBashi.heads(DOMAIN_ID)
      expect(await giriGiriBashi.callStatic.getThresholdHash(DOMAIN_ID, 1)).to.equal(HASH_GOOD)
      await giriGiriBashi.getThresholdHash(DOMAIN_ID, 1)
      const newHead = await giriGiriBashi.heads(DOMAIN_ID)
      expect(newHead).not.to.equal(oldHead)
    })
  })

  describe("getHash()", function () {
    it("Updates head for given domain", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, settings } = await setup()
      await giriGiriBashi.enableOracleAdapters(
        DOMAIN_ID,
        [mockOracleAdapter.address, secondMockOracleAdapter.address],
        [settings, settings],
      )
      let adapters
      if (secondMockOracleAdapter.address > mockOracleAdapter.address) {
        adapters = [mockOracleAdapter.address, secondMockOracleAdapter.address]
      } else {
        adapters = [secondMockOracleAdapter.address, mockOracleAdapter.address]
      }
      const oldHead = await giriGiriBashi.heads(DOMAIN_ID)
      await giriGiriBashi.getHash(DOMAIN_ID, 1, adapters)
      const newHead = await giriGiriBashi.heads(DOMAIN_ID)
      expect(newHead).not.to.equal(oldHead)
    })
  })

  describe("challengeOracleAdapter()", function () {
    it("Reverts if given adapter is not enabled", async function () {
      const { giriGiriBashi, mockOracleAdapter } = await setup()
      await expect(giriGiriBashi.challengeOracleAdapter(DOMAIN_ID, 1, mockOracleAdapter.address))
        .to.be.revertedWithCustomError(giriGiriBashi, "AdapterNotEnabled")
        .withArgs(giriGiriBashi.address, mockOracleAdapter.address)
    })
    it("Reverts if value is less than minimum bond", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, settings } = await setup()
      await giriGiriBashi.enableOracleAdapters(
        DOMAIN_ID,
        [mockOracleAdapter.address, secondMockOracleAdapter.address],
        [settings, settings],
      )
      await expect(giriGiriBashi.challengeOracleAdapter(DOMAIN_ID, 1, mockOracleAdapter.address))
        .to.be.revertedWithCustomError(giriGiriBashi, "NotEnoughtValue")
        .withArgs(giriGiriBashi.address, mockOracleAdapter.address, 0)
    })
    it("Reverts if adapter is already quarantined", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, settings } = await setup()
      const adapters = [mockOracleAdapter.address, secondMockOracleAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, adapters, [settings, settings])

      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head - CHALLENGE_RANGE + 2
      await giriGiriBashi.challengeOracleAdapter(DOMAIN_ID, challengeBlock, mockOracleAdapter.address, {
        value: BOND,
      })
      const challengeId = await giriGiriBashi.getChallengeId(DOMAIN_ID, challengeBlock, mockOracleAdapter.address)
      const challenge = await giriGiriBashi.challenges(challengeId)
      const increaseAmount = challenge.timestamp.add(settings.timeout).add(1)

      await network.provider.send("evm_setNextBlockTimestamp", [increaseAmount.toHexString()])

      await giriGiriBashi.resolveChallenge(DOMAIN_ID, challengeBlock, mockOracleAdapter.address, [
        secondMockOracleAdapter.address,
      ])
      await expect(
        giriGiriBashi.callStatic.challengeOracleAdapter(DOMAIN_ID, challengeBlock, mockOracleAdapter.address, {
          value: BOND,
        }),
      )
        .to.be.revertedWithCustomError(giriGiriBashi, "AlreadyQuarantined")
        .withArgs(giriGiriBashi.address, mockOracleAdapter.address)
    })
    it("Reverts if duplicate challenge exists", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, settings } = await setup()
      const adapters = [mockOracleAdapter.address, secondMockOracleAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, adapters, [settings, settings])
      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      expect(
        await giriGiriBashi.challengeOracleAdapter(DOMAIN_ID, head - CHALLENGE_RANGE + 1, mockOracleAdapter.address, {
          value: BOND,
        }),
      )
      await expect(
        giriGiriBashi.callStatic.challengeOracleAdapter(
          DOMAIN_ID,
          head - CHALLENGE_RANGE + 1,
          mockOracleAdapter.address,
          {
            value: BOND,
          },
        ),
      ).to.be.revertedWithCustomError(giriGiriBashi, "DuplicateChallenge")
    })
    it("Reverts if challenge is out of range", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, settings } = await setup()
      const adapters = [mockOracleAdapter.address, secondMockOracleAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, adapters, [settings, settings])
      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)

      // revert on block before start ID
      await expect(
        giriGiriBashi.callStatic.challengeOracleAdapter(DOMAIN_ID, 0, mockOracleAdapter.address, { value: BOND }),
      )
        .to.be.revertedWithCustomError(giriGiriBashi, "OutOfRange")
        .withArgs(giriGiriBashi.address, mockOracleAdapter.address, 0)

      // revert on block too far in the future
      const outOfRangeBlock = head + CHALLENGE_RANGE + 1
      await expect(
        giriGiriBashi.callStatic.challengeOracleAdapter(DOMAIN_ID, outOfRangeBlock, mockOracleAdapter.address, {
          value: BOND,
        }),
      )
        .to.be.revertedWithCustomError(giriGiriBashi, "OutOfRange")
        .withArgs(giriGiriBashi.address, mockOracleAdapter.address, outOfRangeBlock)

      // revert on block too deep for adapter
      const tooDeepBlock = 1
      await expect(
        giriGiriBashi.callStatic.challengeOracleAdapter(DOMAIN_ID, tooDeepBlock, mockOracleAdapter.address, {
          value: BOND,
        }),
      )
        .to.be.revertedWithCustomError(giriGiriBashi, "OutOfRange")
        .withArgs(giriGiriBashi.address, mockOracleAdapter.address, tooDeepBlock)

      // make sure it can actually be successful / doesn't always revert
      expect(
        await giriGiriBashi.challengeOracleAdapter(DOMAIN_ID, head - CHALLENGE_RANGE + 1, mockOracleAdapter.address, {
          value: BOND,
        }),
      )
    })
    it("Creates a challenge for the given adapter", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, settings } = await setup()
      const adapters = [mockOracleAdapter.address, secondMockOracleAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, adapters, [settings, settings])

      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      expect(
        await giriGiriBashi.challengeOracleAdapter(DOMAIN_ID, head - CHALLENGE_RANGE + 1, mockOracleAdapter.address, {
          value: BOND,
        }),
      )
    })
    it("Emits the ChallengeCreated event", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, settings } = await setup()
      const adapters = [mockOracleAdapter.address, secondMockOracleAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, adapters, [settings, settings])
      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)

      await expect(
        giriGiriBashi.challengeOracleAdapter(DOMAIN_ID, head - CHALLENGE_RANGE + 1, mockOracleAdapter.address, {
          value: BOND,
        }),
      ).to.emit(giriGiriBashi, "ChallengeCreated")
    })
  })

  describe("resolveChallenge()", function () {
    it("Reverts if challenge is not found", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter } = await setup()
      await expect(
        giriGiriBashi.callStatic.resolveChallenge(DOMAIN_ID, 5, mockOracleAdapter.address, [
          secondMockOracleAdapter.address,
        ]),
      ).to.be.revertedWithCustomError(giriGiriBashi, "ChallengeNotFound")
    })
    it("Reverts if adapter has not yet timed out", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, settings } = await setup()
      const adapters = [mockOracleAdapter.address, secondMockOracleAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, adapters, [settings, settings])

      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head - CHALLENGE_RANGE + 1
      await giriGiriBashi.challengeOracleAdapter(DOMAIN_ID, challengeBlock, mockOracleAdapter.address, {
        value: BOND,
      })
      const challengeId = await giriGiriBashi.getChallengeId(DOMAIN_ID, challengeBlock, mockOracleAdapter.address)
      const challenge = await giriGiriBashi.challenges(challengeId)
      const increaseAmount = challenge.timestamp.add(settings.timeout).sub(1)

      await network.provider.send("evm_setNextBlockTimestamp", [increaseAmount.toHexString()])

      await expect(
        giriGiriBashi.resolveChallenge(DOMAIN_ID, challengeBlock, mockOracleAdapter.address, [
          secondMockOracleAdapter.address,
        ]),
      ).to.be.revertedWithCustomError(giriGiriBashi, "AdapterHasNotYetTimedOut")
    })
    it("Quarantines adapter and returns bond if adapter times out", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, settings, wallet } = await setup()
      const adapters = [mockOracleAdapter.address, secondMockOracleAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, adapters, [settings, settings])
      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head - CHALLENGE_RANGE + 1

      await giriGiriBashi.challengeOracleAdapter(DOMAIN_ID, challengeBlock, mockOracleAdapter.address, {
        value: BOND,
      })
      const challengeId = await giriGiriBashi.getChallengeId(DOMAIN_ID, challengeBlock, mockOracleAdapter.address)
      const challenge = await giriGiriBashi.challenges(challengeId)
      const increaseAmount = challenge.timestamp.add(settings.timeout).add(1)

      await network.provider.send("evm_setNextBlockTimestamp", [increaseAmount.toHexString()])

      const previousBalance = await ethers.provider.getBalance(wallet.address)

      await giriGiriBashi.resolveChallenge(DOMAIN_ID, challengeBlock, mockOracleAdapter.address, [
        secondMockOracleAdapter.address,
      ])

      const newBalance = await ethers.provider.getBalance(wallet.address)
      await expect(newBalance).to.be.greaterThan(previousBalance)

      const quarantined = (await giriGiriBashi.settings(mockOracleAdapter.address)).quarantined
      await expect(quarantined).to.equal(true)
    })
    it("Keeps bond if _adapters + adapter equals threshold and agree", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, settings } = await setup()
      const adapters = [mockOracleAdapter.address, secondMockOracleAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, adapters, [settings, settings])

      await giriGiriBashi.getHash(DOMAIN_ID, 1, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head.add(20)
      await giriGiriBashi.challengeOracleAdapter(DOMAIN_ID, challengeBlock, mockOracleAdapter.address, {
        value: BOND,
      })

      expect(
        await giriGiriBashi.resolveChallenge(DOMAIN_ID, challengeBlock, mockOracleAdapter.address, [
          secondMockOracleAdapter.address,
        ]),
      )
      expect(await ethers.provider.getBalance(ADDRESS_TWO)).to.equal(BOND)
      const quarantined = (await giriGiriBashi.settings(mockOracleAdapter.address)).quarantined
      expect(quarantined).to.equal(false)
    })
    it("Reverts if _adapters + adapter equals threshold and disagree", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, settings, hashi } = await setup()
      const adapters = [mockOracleAdapter.address, secondMockOracleAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, adapters, [settings, settings])

      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head.add(1)
      await giriGiriBashi.challengeOracleAdapter(DOMAIN_ID, challengeBlock, mockOracleAdapter.address, {
        value: BOND,
      })

      await expect(
        giriGiriBashi.resolveChallenge(DOMAIN_ID, challengeBlock, mockOracleAdapter.address, [
          secondMockOracleAdapter.address,
        ]),
      )
        .to.be.revertedWithCustomError(hashi, "OraclesDisagree")
        .withArgs(giriGiriBashi.address, mockOracleAdapter.address, secondMockOracleAdapter.address)
    })
    it("Keeps bond if canonical hash matches hash reported by challenged adapter", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, thirdMockOracleAdapter, settings } =
        await setup()
      let adapters = [mockOracleAdapter.address, secondMockOracleAdapter.address, thirdMockOracleAdapter.address]
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, adapters, [settings, settings, settings])
      adapters = adapters.sort(compareAddresses)

      await giriGiriBashi.getHash(DOMAIN_ID, 1, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head.add(20)
      await giriGiriBashi.challengeOracleAdapter(DOMAIN_ID, challengeBlock, mockOracleAdapter.address, {
        value: BOND,
      })

      const previousBalance = await ethers.provider.getBalance(ADDRESS_TWO)

      await giriGiriBashi.resolveChallenge(
        DOMAIN_ID,
        challengeBlock,
        mockOracleAdapter.address,
        [secondMockOracleAdapter.address, thirdMockOracleAdapter.address].sort(compareAddresses),
      )
      expect(await ethers.provider.getBalance(ADDRESS_TWO)).to.equal(previousBalance.add(BOND))
      const quarantined = (await giriGiriBashi.settings(mockOracleAdapter.address)).quarantined
      expect(quarantined).to.equal(false)
    })
    it("Quarantines oracle and returns bond if challenged adapter disagrees with canonical hash", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, thirdMockOracleAdapter, settings } =
        await setup()
      let adapters = [mockOracleAdapter.address, secondMockOracleAdapter.address, thirdMockOracleAdapter.address]
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, adapters, [settings, settings, settings])
      adapters = adapters.sort(compareAddresses)

      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head.add(1)
      await giriGiriBashi.challengeOracleAdapter(DOMAIN_ID, challengeBlock, mockOracleAdapter.address, {
        value: BOND,
      })

      await giriGiriBashi.resolveChallenge(
        DOMAIN_ID,
        challengeBlock,
        mockOracleAdapter.address,
        [secondMockOracleAdapter.address, thirdMockOracleAdapter.address].sort(compareAddresses),
      )
      const quarantined = (await giriGiriBashi.settings(mockOracleAdapter.address)).quarantined
      await expect(quarantined).to.equal(true)
    })
    it("Clears state after challenge is resolved", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, thirdMockOracleAdapter, settings } =
        await setup()
      let adapters = [mockOracleAdapter.address, secondMockOracleAdapter.address, thirdMockOracleAdapter.address]
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, adapters, [settings, settings, settings])
      adapters = adapters.sort(compareAddresses)

      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head.add(1)
      await giriGiriBashi.challengeOracleAdapter(DOMAIN_ID, challengeBlock, mockOracleAdapter.address, {
        value: BOND,
      })

      await giriGiriBashi.resolveChallenge(
        DOMAIN_ID,
        challengeBlock,
        mockOracleAdapter.address,
        [secondMockOracleAdapter.address, thirdMockOracleAdapter.address].sort(compareAddresses),
      )
      const quarantined = (await giriGiriBashi.settings(mockOracleAdapter.address)).quarantined
      expect(quarantined).to.equal(true)
      const challengeId = await giriGiriBashi.getChallengeId(DOMAIN_ID, challengeBlock, mockOracleAdapter.address)
      const challenge = await giriGiriBashi.challenges(challengeId)
      expect(challenge.challenger).to.equal(ADDRESS_ZERO)
      expect(challenge.timestamp).to.equal(0)
      expect(challenge.bond).to.equal(0)
    })
    it("Emits ChallengeResolved() event", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, thirdMockOracleAdapter, settings, wallet } =
        await setup()
      const adapters = [
        mockOracleAdapter.address,
        secondMockOracleAdapter.address,
        thirdMockOracleAdapter.address,
      ].sort(compareAddresses)
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, adapters, [settings, settings, settings])

      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head.add(1)
      await giriGiriBashi.challengeOracleAdapter(DOMAIN_ID, challengeBlock, mockOracleAdapter.address, {
        value: BOND,
      })

      const challengeId = await giriGiriBashi.getChallengeId(DOMAIN_ID, challengeBlock, mockOracleAdapter.address)
      await expect(
        giriGiriBashi.resolveChallenge(
          DOMAIN_ID,
          challengeBlock,
          mockOracleAdapter.address,
          [secondMockOracleAdapter.address, thirdMockOracleAdapter.address].sort(compareAddresses),
        ),
      )
        .to.emit(giriGiriBashi, "ChallengeResolved")
        .withArgs(
          giriGiriBashi.address,
          challengeId,
          DOMAIN_ID,
          challengeBlock,
          mockOracleAdapter.address,
          wallet.address,
          BOND,
          true,
        )
    })
  })

  describe("declareNoConfidence()", function () {
    it("Reverts if too few adapters were provided to prove no confidence", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, thirdMockOracleAdapter, settings } =
        await setup()
      const adapters = [
        mockOracleAdapter.address,
        secondMockOracleAdapter.address,
        thirdMockOracleAdapter.address,
      ].sort(compareAddresses)
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, adapters, [settings, settings, settings])
      await expect(giriGiriBashi.callStatic.declareNoConfidence(DOMAIN_ID, 20, [mockOracleAdapter.address]))
        .to.be.revertedWithCustomError(giriGiriBashi, "CannotProveNoConfidence")
        .withArgs(giriGiriBashi.address, DOMAIN_ID, 20, [mockOracleAdapter.address])
    })
    it("Reverts if any of the provided adapters agree", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, thirdMockOracleAdapter, settings } =
        await setup()
      const adapters = [
        mockOracleAdapter.address,
        secondMockOracleAdapter.address,
        thirdMockOracleAdapter.address,
      ].sort(compareAddresses)
      const adaptersThatAgree = [secondMockOracleAdapter.address, thirdMockOracleAdapter.address].sort(compareAddresses)
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, adapters, [settings, settings, settings])
      await expect(giriGiriBashi.callStatic.declareNoConfidence(DOMAIN_ID, 22, adapters))
        .to.be.revertedWithCustomError(giriGiriBashi, "AdaptersAgreed")
        .withArgs(giriGiriBashi.address, adaptersThatAgree[0], adaptersThatAgree[1])
    })
    it("Clears state for domain", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, thirdMockOracleAdapter, settings } =
        await setup()
      const adapters = [
        mockOracleAdapter.address,
        secondMockOracleAdapter.address,
        thirdMockOracleAdapter.address,
      ].sort(compareAddresses)
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, adapters, [settings, settings, settings])
      expect(await giriGiriBashi.declareNoConfidence(DOMAIN_ID, 20, adapters))
      const domain = await giriGiriBashi.domains(DOMAIN_ID)
      const challengeRange = await giriGiriBashi.challengeRanges(DOMAIN_ID)
      expect(domain.threshold).to.equal(ethers.constants.MaxUint256)
      expect(challengeRange).to.equal(0)
    })
    it("Emits NoConfidenceDeclareed() event", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, thirdMockOracleAdapter, settings } =
        await setup()
      const adapters = [
        mockOracleAdapter.address,
        secondMockOracleAdapter.address,
        thirdMockOracleAdapter.address,
      ].sort(compareAddresses)
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, adapters, [settings, settings, settings])
      await expect(giriGiriBashi.declareNoConfidence(DOMAIN_ID, 20, adapters))
        .to.emit(giriGiriBashi, "NoConfidenceDeclareed")
        .withArgs(giriGiriBashi.address, DOMAIN_ID)
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
        .withArgs(giriGiriBashi.address, DOMAIN_ID)
    })
    it("Sets challenge range for given domain", async function () {
      const { giriGiriBashi } = await setup()
      expect(await giriGiriBashi.setChallengeRange(2, CHALLENGE_RANGE))
      const challengeRange = await giriGiriBashi.challengeRanges(2)
      expect(challengeRange).to.equal(CHALLENGE_RANGE)
    })
    it("Emits the ChallegenRangeUpdated event", async function () {
      const { giriGiriBashi } = await setup()
      await expect(giriGiriBashi.setChallengeRange(2, CHALLENGE_RANGE))
        .to.emit(giriGiriBashi, "ChallegenRangeUpdated")
        .withArgs(giriGiriBashi.address, 2, CHALLENGE_RANGE)
    })
  })

  describe("replaceQuaratinedOrcales()", function () {
    it("Reverts if given arrays are unequal length", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, settings } = await setup()
      await giriGiriBashi.enableOracleAdapters(
        DOMAIN_ID,
        [mockOracleAdapter.address, secondMockOracleAdapter.address],
        [settings, settings],
      )
      await expect(
        giriGiriBashi.replaceQuaratinedOrcales(
          DOMAIN_ID,
          [mockOracleAdapter.address, secondMockOracleAdapter.address],
          [ADDRESS_ZERO],
          [settings, settings],
        ),
      ).to.be.revertedWithCustomError(giriGiriBashi, "UnequalArrayLengths")
      await expect(
        giriGiriBashi.replaceQuaratinedOrcales(
          DOMAIN_ID,
          [mockOracleAdapter.address],
          [ADDRESS_ZERO, ADDRESS_ZERO],
          [settings, settings],
        ),
      ).to.be.revertedWithCustomError(giriGiriBashi, "UnequalArrayLengths")
      await expect(
        giriGiriBashi.replaceQuaratinedOrcales(
          DOMAIN_ID,
          [mockOracleAdapter.address, secondMockOracleAdapter.address],
          [ADDRESS_ZERO, ADDRESS_ZERO],
          [settings],
        ),
      ).to.be.revertedWithCustomError(giriGiriBashi, "UnequalArrayLengths")
    })
    it("Reverts if given adapter is not quarantined", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, settings } = await setup()
      await giriGiriBashi.enableOracleAdapters(
        DOMAIN_ID,
        [mockOracleAdapter.address, secondMockOracleAdapter.address],
        [settings, settings],
      )
      await expect(
        giriGiriBashi.replaceQuaratinedOrcales(
          DOMAIN_ID,
          [mockOracleAdapter.address, secondMockOracleAdapter.address],
          [ADDRESS_ZERO, ADDRESS_ZERO],
          [settings, settings],
        ),
      ).to.be.revertedWithCustomError(giriGiriBashi, "AdapterNotQuarantined")
    })
    it("Replaces oracle adapters and initializes settings", async function () {
      const { giriGiriBashi, mockOracleAdapter, secondMockOracleAdapter, thirdMockOracleAdapter, settings } =
        await setup()
      let adapters = [mockOracleAdapter.address, secondMockOracleAdapter.address, thirdMockOracleAdapter.address]
      await giriGiriBashi.enableOracleAdapters(DOMAIN_ID, adapters, [settings, settings, settings])
      adapters = adapters.sort(compareAddresses)

      await giriGiriBashi.getHash(DOMAIN_ID, 21, adapters)
      const head = await giriGiriBashi.heads(DOMAIN_ID)
      const challengeBlock = head.add(1)
      await giriGiriBashi.challengeOracleAdapter(DOMAIN_ID, challengeBlock, mockOracleAdapter.address, {
        value: BOND,
      })

      await giriGiriBashi.resolveChallenge(
        DOMAIN_ID,
        challengeBlock,
        mockOracleAdapter.address,
        [secondMockOracleAdapter.address, thirdMockOracleAdapter.address].sort(compareAddresses),
      )
      expect(
        await giriGiriBashi.replaceQuaratinedOrcales(DOMAIN_ID, [mockOracleAdapter.address], [ADDRESS_TWO], [settings]),
      )
      const adapterSettings = await giriGiriBashi.settings(ADDRESS_TWO)
      expect(adapterSettings.quarantined).to.deep.equal(settings.quarantined)
      expect(adapterSettings.minimumBond).to.deep.equal(settings.minimumBond)
      expect(adapterSettings.startId).to.deep.equal(settings.startId)
      expect(adapterSettings.idDepth).to.deep.equal(settings.idDepth)
      expect(adapterSettings.timeout).to.deep.equal(settings.timeout)
    })
  })
})
