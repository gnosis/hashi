import * as anchor from "@coral-xyz/anchor"
import { Program } from "@coral-xyz/anchor"
import { SystemProgram, PublicKey } from "@solana/web3.js"
import { expect } from "chai"

import { intToBytes32Buff } from "./utils"

import { Hashi } from "../target/types/hashi"
import { Adapter } from "../target/types/adapter"

const DOMAIN = intToBytes32Buff(1)
const ADAPTER_ID_1 = Buffer.from("2244e849e1d0cb22ba71f9ef4b933b7f3f72f13595966f9adc6e289501941c8d", "hex") // sha256("mock-adapter-1")
const ADAPTER_ID_2 = Buffer.from("77038193f4439e5312f8cf018ccc79007c42753aadefa68598e0282840e2f2b5", "hex") // sha256("mock-adapter-2")
const ADAPTER_ID_3 = Buffer.from("feb487914b67a80f0dda2a37b1f2da9086dbf67c1b0676b2f9ee61a877035e63", "hex") // sha256("mock-adapter-3")
const ADAPTER_IDS = [ADAPTER_ID_1, ADAPTER_ID_2, ADAPTER_ID_3]

describe("hashi", () => {
  const provider = anchor.AnchorProvider.local()
  anchor.setProvider(provider)

  const hashi = anchor.workspace.Hashi as Program<Hashi>
  const adapter = anchor.workspace.Adapter as Program<Adapter>

  it("should not fail if the majority of adapters agree on an hash", async () => {
    const threshold = 2
    const id = 1
    const hashes = [
      Array.from(
        Uint8Array.from(Buffer.from("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "hex")),
      ),
      Array.from(
        Uint8Array.from(Buffer.from("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "hex")),
      ),
      Array.from(
        Uint8Array.from(Buffer.from("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "hex")),
      ),
    ]

    const hashAccountsPDA = []
    for (const [index, adapterId] of ADAPTER_IDS.entries()) {
      const [hashAccountPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("hash_account", "utf-8"), adapterId, DOMAIN, intToBytes32Buff(id)],
        adapter.programId,
      )

      await adapter.methods
        .storeHash(adapterId, DOMAIN, intToBytes32Buff(id), hashes[index])
        .accounts({
          hashAccount: hashAccountPDA,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
      hashAccountsPDA.push(hashAccountPDA)
    }

    await hashi.methods
      .checkHashWithThresholdFromAdapters(ADAPTER_IDS, DOMAIN, intToBytes32Buff(id), new anchor.BN(threshold))
      .remainingAccounts(
        hashAccountsPDA.map((_hashAccountPDA) => ({
          isSigner: false,
          isWritable: false,
          pubkey: _hashAccountPDA,
        })),
      )
      .rpc()
  })

  it("should fail if the majority of adapters doesn't agree on an hash", async () => {
    const threshold = 2
    const id = 1
    const hashes = [
      Array.from(
        Uint8Array.from(Buffer.from("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "hex")),
      ),
      Array.from(
        Uint8Array.from(Buffer.from("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "hex")),
      ),
      Array.from(
        Uint8Array.from(Buffer.from("cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc", "hex")),
      ),
    ]

    const hashAccountsPDA = []
    for (const [index, adapterId] of ADAPTER_IDS.entries()) {
      const [hashAccountPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("hash_account", "utf-8"), adapterId, DOMAIN, intToBytes32Buff(id)],
        adapter.programId,
      )

      await adapter.methods
        .storeHash(adapterId, DOMAIN, intToBytes32Buff(id), hashes[index])
        .accounts({
          hashAccount: hashAccountPDA,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
      hashAccountsPDA.push(hashAccountPDA)
    }

    try {
      await hashi.methods
        .checkHashWithThresholdFromAdapters(ADAPTER_IDS, DOMAIN, intToBytes32Buff(id), new anchor.BN(threshold))
        .remainingAccounts(
          hashAccountsPDA.map((_hashAccountPDA) => ({
            isSigner: false,
            isWritable: false,
            pubkey: _hashAccountPDA,
          })),
        )
        .rpc()
    } catch (_err) {
      expect(_err.error.errorCode.code).to.be.eq("ThresholdNotMet")
    }
  })
})
