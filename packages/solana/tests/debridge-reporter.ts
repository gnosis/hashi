/*import * as anchor from "@coral-xyz/anchor"
import { Program } from "@coral-xyz/anchor"
import { AccountMeta, PublicKey, SYSVAR_SLOT_HASHES_PUBKEY } from "@solana/web3.js"
// import { expect } from "chai"

import { DebridgeReporter } from "../target/types/debridge_reporter"

const accountsToMeta = () => {
  const result: AccountMeta[] = [
    {
      isSigner: false,
      isWritable: true,
      pubkey: new PublicKey("6SW1N9Rq2TqT3uQCD4F5zwtTTSFSarZmfyrk829SzsBX"),
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: new PublicKey("So11111111111111111111111111111111111111112"),
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: new PublicKey("8gjgVkHXTttCoSGGtzucFkJUWujQ8pgWuvnHCLSN7i3o"),
    },
    {
      isSigner: false,
      isWritable: false,
      pubkey: new PublicKey("7FmGdfJfDrrM6P68y7jijjj4xU9rH3hsUK2Kyp54iJUx"),
    },
    {
      isSigner: false,
      isWritable: false,
      pubkey: new PublicKey("8L81QZBfwA6Xi9zd49fyUfMRWJBCAxiUxd6jGHPnu1BQ"),
    },
    {
      isSigner: false,
      isWritable: false,
      pubkey: new PublicKey("DeSetTwWhjZq6Pz9Kfdo1KoS5NqtsM6G8ERbX4SSCSft"),
    },
    {
      isSigner: false,
      isWritable: false,
      pubkey: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: new PublicKey("CcjkxrCJvfXrmds78hwCnovkdmTgE12wqojiVLrtW1qn"),
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: new PublicKey("5MgAaNomDg4Y88v7gJ7LSWAyoLpDfcfbXZGQQnFddjJT"),
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: new PublicKey("2LKQceMRwfJNZovtSbsHmfszDYM5kTZHajFry2nqD2pi"),
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: new PublicKey("BzoSTqbp8vZ54Baq2K4LTwGnC8fYvKiEFQDNxdEDnosG"),
    },
    {
      isSigner: false,
      isWritable: false,
      pubkey: new PublicKey("11111111111111111111111111111111"),
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: new PublicKey("dPLMV1ky3H61yRGFfNC6AYmzBePhsdes9oNZ7chPbYW"),
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: new PublicKey("2cU8vjsMnRcusX1WdwZy1AwCLrUWbDw6frnk3XDz3VVK"),
    },
    {
      isSigner: true,
      isWritable: true,
      pubkey: new PublicKey("FsiBNh2KcPrjZFMF7EBCWpUpAo95DfrMXB2U2XrqSFWF"),
    },
    {
      isSigner: false,
      isWritable: false,
      pubkey: new PublicKey("4kQYWVy6Vu8YUXVp5BgQC12ZX1HLRUfkK3bLzBFFjnNW"),
    },
    {
      isSigner: false,
      isWritable: false,
      pubkey: new PublicKey("APMGxdbtubfWLQUACsN2yv2pxkvAgWwuxBe8ohFYoB37"),
    },
    {
      isSigner: false,
      isWritable: false,
      pubkey: new PublicKey("DEbrdGj3HsRsAzx6uH4MKyREKxVAfBydijLUF3ygsFfh"),
    },
  ]

  return result
}

describe("debridge_reporter", () => {
  const provider = anchor.AnchorProvider.local()
  anchor.setProvider(provider)

  const reporter = anchor.workspace.DebridgeReporter as Program<DebridgeReporter>

  it("should dispatch a slot", async () => {
    const targetChainId = Buffer.from("1".padStart(64, "0"), "hex")
    const receiver = Buffer.from("1".padStart(40, "1"), "hex")
    const slot = await provider.connection.getSlot()
    const slotNumberToDispatch = new anchor.BN(slot - 1)

    await reporter.methods
      .dispatchSlot(targetChainId, receiver, slotNumberToDispatch)
      .accounts({
        slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
      })
      .remainingAccounts([...accountsToMeta()])
      .rpc()
  })
})
*/
