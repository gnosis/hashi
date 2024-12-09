import * as anchor from "@coral-xyz/anchor"
import { expect } from "chai"
import { Keypair, LAMPORTS_PER_SOL, PublicKey, PublicKeyInitData, SYSVAR_SLOT_HASHES_PUBKEY } from "@solana/web3.js"
import {
  deriveAddress,
  getPostMessageCpiAccounts,
  getWormholeDerivedAccounts,
} from "@certusone/wormhole-sdk/lib/cjs/solana"
import { getPostedMessage, getProgramSequenceTracker } from "@certusone/wormhole-sdk/lib/cjs/solana/wormhole"
import { CONTRACTS } from "@certusone/wormhole-sdk"
import { Program } from "@coral-xyz/anchor"
import { AbiCoder } from "ethers"

import { WormholeReporter } from "../target/types/wormhole_reporter"

const WORMHOLE_CONTRACTS = CONTRACTS.TESTNET
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
  const payer = new Keypair()
  const reporter = anchor.workspace.WormholeReporter as Program<WormholeReporter>

  before(async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(payer.publicKey, 1000 * LAMPORTS_PER_SOL),
    )
  })

  describe("initialize", () => {
    it("should set up the program", async () => {
      const slot = await provider.connection.getSlot()
      const slotNumberToDispatch = new anchor.BN(slot - 1)

      const message = deriveWormholeMessageKey(reporter.programId, 1n)
      const wormholeAccounts = getPostMessageCpiAccounts(reporter.programId, CORE_BRIDGE_PID, payer.publicKey, message)
      const [configKey] = PublicKey.findProgramAddressSync([Buffer.from("config", "utf-8")], reporter.programId)
      await reporter.methods
        .initialize(slotNumberToDispatch)
        .accounts({
          owner: new PublicKey(payer.publicKey),
          config: configKey,
          wormholeProgram: new PublicKey(CORE_BRIDGE_PID),
          slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
          ...wormholeAccounts,
        } as any)
        .signers([payer])
        .rpc()

      const configData = await reporter.account.config.fetch(configKey)
      expect(configData.owner).deep.equals(payer.publicKey)
      const { wormholeBridge, wormholeFeeCollector } = getWormholeDerivedAccounts(reporter.programId, CORE_BRIDGE_PID)
      expect(configData.wormhole.bridge).deep.equals(wormholeBridge)
      expect(configData.wormhole.feeCollector).deep.equals(wormholeFeeCollector)
    })
  })

  describe("dispatch_slot", () => {
    it("should dispatch slot", async () => {
      const slot = await provider.connection.getSlot()
      const slotNumberToDispatch = new anchor.BN(slot - 1)

      const tracker = await getProgramSequenceTracker(provider.connection, reporter.programId, CORE_BRIDGE_PID)
      const message = deriveWormholeMessageKey(reporter.programId, tracker.sequence + 1n)
      const wormholeAccounts = getPostMessageCpiAccounts(reporter.programId, CORE_BRIDGE_PID, payer.publicKey, message)

      await reporter.methods
        .dispatchSlot(slotNumberToDispatch)
        .accounts({
          config: PublicKey.findProgramAddressSync([Buffer.from("config", "utf-8")], reporter.programId),
          wormholeProgram: new PublicKey(CORE_BRIDGE_PID),
          slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
          ...wormholeAccounts,
        } as any)
        .signers([payer])
        .rpc()

      const { payload } = (
        await getPostedMessage(provider.connection, deriveWormholeMessageKey(reporter.programId, tracker.value() + 1n))
      ).message

      const abiCoder = new AbiCoder()
      const [[dispatchedSlotNumber], [dispatchedSlotHash]] = abiCoder.decode(
        ["uint256[]", "bytes32[]"],
        "0x" + payload.toString("hex"),
      )
      expect(parseInt(dispatchedSlotNumber)).equals(slotNumberToDispatch.toNumber())
      expect(dispatchedSlotHash).to.be.not.null
    })
  })
})
