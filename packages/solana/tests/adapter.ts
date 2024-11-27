import * as anchor from "@coral-xyz/anchor"
import { Program } from "@coral-xyz/anchor"
import { SystemProgram, PublicKey } from "@solana/web3.js"
import { expect } from "chai"

import { intToBytes32Buff } from "./utils"

import { Adapter } from "../target/types/adapter"

const DOMAIN = intToBytes32Buff(1)
const ADAPTER_ID = Buffer.from("7d540e5aca706562723c44571ddc1a40653d3a88dd314aa64cd44dbca1267c56", "hex") // "mock-adapter"

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
      [Buffer.from("hash_account", "utf-8"), ADAPTER_ID, DOMAIN, intToBytes32Buff(id)],
      adapter.programId,
    )

    await adapter.methods
      .storeHash(ADAPTER_ID, DOMAIN, intToBytes32Buff(id), hash)
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
