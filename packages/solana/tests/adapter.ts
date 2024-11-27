import * as anchor from "@coral-xyz/anchor"
import { Program } from "@coral-xyz/anchor"
import { Adapter } from "../target/types/adapter"
import { SystemProgram, PublicKey } from "@solana/web3.js"
import { expect } from "chai"

const DOMAIN = 1

const intToBytes32Buff = (_num: number) => Buffer.from(_num.toString(16).padStart(64, "0"), "hex")

describe("adapter", () => {
  const provider = anchor.AnchorProvider.local()
  anchor.setProvider(provider)

  const adapter = anchor.workspace.Adapter as Program<Adapter>

  it("should store an hash", async () => {
    const id = 1
    const hash = Array.from(
      Uint8Array.from(Buffer.from("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "hex")),
    )

    const [hashAccountPDA] = await PublicKey.findProgramAddressSync(
      [Buffer.from("hash_account", "utf-8"), intToBytes32Buff(DOMAIN), intToBytes32Buff(id)],
      adapter.programId,
    )

    await adapter.methods
      .storeHash(intToBytes32Buff(DOMAIN), intToBytes32Buff(id), hash)
      .accounts({
        hashAccount: hashAccountPDA,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc()

    const hashAccount = await adapter.account.hashAccount.fetch(hashAccountPDA)
    expect(hashAccount.hash).to.be.deep.eq(hash)
  })
})
