import * as anchor from "@coral-xyz/anchor"
import { expect } from "chai"
import { PublicKey, PublicKeyInitData } from "@solana/web3.js"
import {
  deriveAddress,
  getPostMessageCpiAccounts,
  getWormholeDerivedAccounts,
} from "@certusone/wormhole-sdk/lib/cjs/solana"
import { getPostedMessage, getProgramSequenceTracker } from "@certusone/wormhole-sdk/lib/cjs/solana/wormhole"
import { CONTRACTS } from "@certusone/wormhole-sdk"
import { Program } from "@coral-xyz/anchor"
import { AbiCoder } from "ethers"
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system"

import { WormholeReporter } from "../target/types/wormhole_reporter"
import { Snapshotter } from "../target/types/snapshotter"
import { getFakeAccounts } from "./utils"

const WORMHOLE_CONTRACTS = CONTRACTS.MAINNET
const CORE_BRIDGE_PID = new PublicKey(WORMHOLE_CONTRACTS.solana.core)

export const deriveWormholeMessageKey = (_programId: PublicKeyInitData, _sequence: bigint) => {
  return deriveAddress(
    [
      Buffer.from("sent"),
      (() => {
        const buf = Buffer.alloc(8)
        buf.writeBigUInt64LE(_sequence)
        return buf
      })(),
    ],
    _programId,
  )
}

describe("wormhole_reporter", () => {
  const provider = anchor.AnchorProvider.local()
  anchor.setProvider(provider)
  const reporter = anchor.workspace.WormholeReporter as Program<WormholeReporter>
  const snapshotter = anchor.workspace.Snapshotter as Program<Snapshotter>

  before(async () => {
    const [configKey] = PublicKey.findProgramAddressSync([Buffer.from("config", "utf-8")], snapshotter.programId)
    await snapshotter.methods
      .initialize()
      .accounts({
        owner: provider.publicKey,
        config: configKey,
        systemProgram: SYSTEM_PROGRAM_ID,
      } as any)
      .rpc()

    const fakeAccounts = getFakeAccounts(4, snapshotter.programId, "fake11")
    for (const fakeAccount of fakeAccounts) {
      await snapshotter.methods
        .subscribe(fakeAccount)
        .accounts({
          config: configKey,
        } as any)
        .rpc()
    }

    await snapshotter.methods
      .calculateRoot(new anchor.BN(0))
      .accounts({
        config: configKey,
      } as any)
      .remainingAccounts(
        fakeAccounts.map((_fakeAccount) => ({
          isSigner: false,
          isWritable: false,
          pubkey: _fakeAccount,
        })),
      )
      .rpc()
  })

  describe("initialize", () => {
    it("should set up the program", async () => {
      const message = deriveWormholeMessageKey(reporter.programId, 1n)
      const wormholeAccounts = getPostMessageCpiAccounts(
        reporter.programId,
        CORE_BRIDGE_PID,
        provider.publicKey,
        message,
      )
      const [configKey] = PublicKey.findProgramAddressSync([Buffer.from("config", "utf-8")], reporter.programId)
      const [snapshotterConfigkey] = PublicKey.findProgramAddressSync(
        [Buffer.from("config", "utf-8")],
        snapshotter.programId,
      )
      await reporter.methods
        .initialize()
        .accounts({
          owner: new PublicKey(provider.publicKey),
          config: configKey,
          wormholeProgram: new PublicKey(CORE_BRIDGE_PID),
          snapshotterConfig: snapshotterConfigkey,
          ...wormholeAccounts,
        } as any)
        .rpc()

      const configData = await reporter.account.config.fetch(configKey)
      expect(configData.owner).deep.equals(provider.publicKey)
      const { wormholeBridge, wormholeFeeCollector } = getWormholeDerivedAccounts(reporter.programId, CORE_BRIDGE_PID)
      expect(configData.wormhole.bridge).deep.equals(wormholeBridge)
      expect(configData.wormhole.feeCollector).deep.equals(wormholeFeeCollector)
      expect(configData.snapshotterConfig).deep.equals(snapshotterConfigkey)
    })
  })

  describe("dispatch_root", () => {
    it("should dispatch a root", async () => {
      const tracker = await getProgramSequenceTracker(provider.connection, reporter.programId, CORE_BRIDGE_PID)
      const message = deriveWormholeMessageKey(reporter.programId, tracker.sequence + 1n)
      const wormholeAccounts = getPostMessageCpiAccounts(
        reporter.programId,
        CORE_BRIDGE_PID,
        provider.publicKey,
        message,
      )
      const [configKey] = PublicKey.findProgramAddressSync([Buffer.from("config", "utf-8")], reporter.programId)
      const [snapshotterConfigkey] = PublicKey.findProgramAddressSync(
        [Buffer.from("config", "utf-8")],
        snapshotter.programId,
      )

      await reporter.methods
        .dispatchRoot()
        .accounts({
          config: configKey,
          wormholeProgram: new PublicKey(CORE_BRIDGE_PID),
          snapshotterConfig: snapshotterConfigkey,
          ...wormholeAccounts,
        } as any)
        .rpc()

      const { payload } = (
        await getPostedMessage(provider.connection, deriveWormholeMessageKey(reporter.programId, tracker.value() + 1n))
      ).message

      const abiCoder = new AbiCoder()
      const [[nonce], [root]] = abiCoder.decode(["uint256[]", "bytes32[]"], "0x" + payload.toString("hex"))
      expect(parseInt(nonce)).equals(1)
      expect(root).to.be.not.null
    })
  })
})
