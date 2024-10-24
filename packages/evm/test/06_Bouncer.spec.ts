import { expect } from "chai"
import { Contract } from "ethers"
import { ethers } from "hardhat"

import Message from "./utils/Message"
import { Chains } from "./utils/constants"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"

let reporter1: Contract,
  reporter2: Contract,
  reporter3: Contract,
  reporter4: Contract,
  headerStorage: Contract,
  yaho: Contract,
  yaru: Contract,
  hashi: Contract,
  adapter1: Contract,
  adapter2: Contract,
  adapter3: Contract,
  adapter4: Contract,
  pingPong: Contract,
  bouncer1: Contract,
  bouncer2: Contract,
  owner: SignerWithAddress

describe("Bouncer", () => {
  beforeEach(async () => {
    const signers = await ethers.getSigners()
    owner = signers[0]

    const Yaru = await ethers.getContractFactory("Yaru")
    const Yaho = await ethers.getContractFactory("Yaho")
    const Hashi = await ethers.getContractFactory("Hashi")
    const Reporter = await ethers.getContractFactory("MockReporter")
    const Adapter = await ethers.getContractFactory("MockAdapter")
    const PingPong = await ethers.getContractFactory("PingPong")
    const HeaderStorage = await ethers.getContractFactory("HeaderStorage")
    const Bouncer = await ethers.getContractFactory("Bouncer")

    hashi = await Hashi.deploy()
    yaho = await Yaho.deploy()
    headerStorage = await HeaderStorage.deploy()
    yaru = await Yaru.deploy(hashi.address, yaho.address, Chains.Hardhat)
    reporter1 = await Reporter.deploy(headerStorage.address, yaho.address)
    reporter2 = await Reporter.deploy(headerStorage.address, yaho.address)
    reporter3 = await Reporter.deploy(headerStorage.address, yaho.address)
    reporter4 = await Reporter.deploy(headerStorage.address, yaho.address)
    adapter1 = await Adapter.deploy()
    adapter2 = await Adapter.deploy()
    adapter3 = await Adapter.deploy()
    adapter4 = await Adapter.deploy()
    pingPong = await PingPong.deploy()

    bouncer1 = await Bouncer.deploy(yaho.address, yaru.address)
    bouncer2 = await Bouncer.deploy(yaho.address, yaru.address)
  })

  it(`should be able to execute a message after ONE hop`, async () => {
    const abiCoder = new ethers.utils.AbiCoder()
    const threshold = 1
    const expectedAdaptersHash = ethers.utils.sha256(abiCoder.encode(["address[]"], [[adapter1.address]]))
    const header =
      "0x04510001" +
      "000001" + // message length
      "01" + // raw message
      "00" + // hops nonce
      "02" + // hops count
      "000000D8" + // 184 bytes = 1th hop size
      "0000000000000001" + // chain protocol
      Chains.Hardhat.toString(16).padStart(32, "0") + // chain protocol identifier
      pingPong.address.slice(2).padStart(64, "0") + // receiver
      Chains.Hardhat.toString(16).padStart(32, "0") + // expected source chain id
      owner.address.slice(2).padStart(64, "0") + // expected sender
      "00000001" + // expected threshold
      expectedAdaptersHash.slice(2) + // expected adapters hash
      "00000001" + // threshold
      "00000001" + // reporters length
      reporter2.address.slice(2).padStart(64, "0") +
      "00000001" + // adapters length
      adapter2.address.slice(2).padStart(64, "0")

    let tx = await yaho.dispatchMessagesToAdapters(
      Chains.Hardhat,
      [threshold],
      [bouncer1.address],
      [header],
      [reporter1.address],
      [adapter1.address],
    )
    const [message1] = Message.fromReceipt(await tx.wait(1))
    const hash1 = await yaho.calculateMessageHash(message1.serialize())
    let adapters = [adapter1]
    for (let i = 0; i < threshold; i++) {
      await adapters[i].setHashes(Chains.Hardhat, [message1.id], [hash1])
    }

    tx = await yaru.executeMessages([message1])
    const [message2] = Message.fromReceipt(await tx.wait(1))
    const hash2 = await yaho.calculateMessageHash(message2.serialize())
    adapters = [adapter2]
    for (let i = 0; i < threshold; i++) {
      await adapters[i].setHashes(Chains.Hardhat, [message2.id], [hash2])
    }
    await expect(yaru.executeMessages([message2])).to.emit(pingPong, "Pong")
  })

  it(`should be able to execute a message after TWO hops`, async () => {
    const abiCoder = new ethers.utils.AbiCoder()
    const threshold = 1
    const expectedAdaptersHash1 = ethers.utils.sha256(abiCoder.encode(["address[]"], [[adapter1.address]]))
    const expectedAdaptersHash2 = ethers.utils.sha256(abiCoder.encode(["address[]"], [[adapter2.address]]))

    const header =
      "0x04510001" +
      "000001" + // message length
      "01" + // raw message
      "00" + // hops nonce
      "02" + // hops count
      "000000D8" + // 184 bytes = 1th hop size
      "0000000000000001" + // chain protocol
      Chains.Hardhat.toString(16).padStart(32, "0") + // chain protocol identifier
      bouncer2.address.slice(2).padStart(64, "0") + // receiver
      Chains.Hardhat.toString(16).padStart(32, "0") + // expected source chain id
      owner.address.slice(2).padStart(64, "0") + // expected sender
      "00000001" + // expected threshold
      expectedAdaptersHash1.slice(2) + // expected adapters hash
      "00000001" + // threshold
      "00000001" + // reporters length
      reporter2.address.slice(2).padStart(64, "0") +
      "00000001" + // adapters length
      adapter2.address.slice(2).padStart(64, "0") +
      "000000D8" + // 184 bytes = 2th hop size
      "0000000000000001" + // chain protocol
      Chains.Hardhat.toString(16).padStart(32, "0") + // chain protocol identifier
      pingPong.address.slice(2).padStart(64, "0") + // receiver
      Chains.Hardhat.toString(16).padStart(32, "0") + // expected source chain id
      bouncer1.address.slice(2).padStart(64, "0") + // expected sender
      "00000001" + // expected threshold
      expectedAdaptersHash2.slice(2) + // expected adapters hash
      "00000001" + // threshold
      "00000002" + // reporters length
      reporter3.address.slice(2).padStart(64, "0") +
      reporter4.address.slice(2).padStart(64, "0") +
      "00000002" + // adapters length
      adapter3.address.slice(2).padStart(64, "0") +
      adapter4.address.slice(2).padStart(64, "0")

    let tx = await yaho.dispatchMessagesToAdapters(
      Chains.Hardhat,
      [threshold],
      [bouncer1.address],
      [header],
      [reporter1.address],
      [adapter1.address],
    )
    const [message1] = Message.fromReceipt(await tx.wait(1))
    const hash1 = await yaho.calculateMessageHash(message1.serialize())
    let adapters = [adapter1, adapter2]
    for (let i = 0; i < threshold; i++) {
      await adapters[i].setHashes(Chains.Hardhat, [message1.id], [hash1])
    }

    tx = await yaru.executeMessages([message1])
    const [message2] = Message.fromReceipt(await tx.wait(1))
    const hash2 = await yaho.calculateMessageHash(message2.serialize())
    adapters = [adapter2]
    for (let i = 0; i < threshold; i++) {
      await adapters[i].setHashes(Chains.Hardhat, [message2.id], [hash2])
    }

    tx = await yaru.executeMessages([message2])
    const [message3] = Message.fromReceipt(await tx.wait(1))
    const hash3 = await yaho.calculateMessageHash(message3.serialize())
    adapters = [adapter3, adapter4]
    for (let i = 0; i < threshold; i++) {
      await adapters[i].setHashes(Chains.Hardhat, [message3.id], [hash3])
    }

    await expect(yaru.executeMessages([message3])).to.emit(pingPong, "Pong")
  })
})
