import * as anchor from "@coral-xyz/anchor"
import { Program } from "@coral-xyz/anchor"
import { PublicKey } from "@solana/web3.js"
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system"
import { expect } from "chai"

import { Snapshotter } from "../target/types/snapshotter"
import { getFakeAccounts } from "./utils"

describe("snapshotter", () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const snapshotter = anchor.workspace.Snapshotter as Program<Snapshotter>

  describe("initialize", () => {
    it("should setup the program", async () => {
      const [configKey] = PublicKey.findProgramAddressSync([Buffer.from("config", "utf-8")], snapshotter.programId)
      await snapshotter.methods
        .initialize()
        .accounts({
          owner: provider.publicKey,
          config: configKey,
          systemProgram: SYSTEM_PROGRAM_ID,
        } as any)
        .rpc()
      const configData = await snapshotter.account.config.fetch(configKey)
      expect(configData.subscribedAccounts.length).to.be.eq(0)
    })
  })

  describe("subscribe", () => {
    it("should subscribe an account", async () => {
      const [configKey] = PublicKey.findProgramAddressSync([Buffer.from("config", "utf-8")], snapshotter.programId)

      const [fakeAccount] = getFakeAccounts(1, snapshotter.programId, "fake0")
      await snapshotter.methods
        .subscribe(fakeAccount)
        .accounts({
          config: configKey,
        } as any)
        .rpc()

      const configData = await snapshotter.account.config.fetch(configKey)
      expect(configData.subscribedAccounts.length).to.be.eq(1)
      expect(configData.subscribedAccounts[0].toString()).to.be.eq(fakeAccount.toString())
    })

    it("should not subscribe the same account twice", async () => {
      const [configKey] = PublicKey.findProgramAddressSync([Buffer.from("config", "utf-8")], snapshotter.programId)
      try {
        const [fakeAccount] = getFakeAccounts(1, snapshotter.programId, "fake0")
        await snapshotter.methods
          .subscribe(fakeAccount)
          .accounts({
            config: configKey,
          } as any)
          .rpc()
      } catch (_err) {
        expect(_err.error.errorCode.code).to.be.eq("AccountAlreadySubscribed")
      }
    })
  })

  describe("calculate_root", () => {
    it("should calculate the root with 1 batch (5)", async () => {
      const [configKey] = PublicKey.findProgramAddressSync([Buffer.from("config", "utf-8")], snapshotter.programId)

      const fakeAccounts = getFakeAccounts(4, snapshotter.programId, "fake1")
      for (const fakeAccount of fakeAccounts) {
        await snapshotter.methods
          .subscribe(fakeAccount)
          .accounts({
            config: configKey,
          } as any)
          .rpc()
      }

      const fakeAccountsRemainingAccounts = fakeAccounts.map((_fakeAccount) => ({
        isSigner: false,
        isWritable: false,
        pubkey: _fakeAccount,
      }))

      await snapshotter.methods
        .calculateRoot(new anchor.BN(0))
        .accounts({
          config: configKey,
        } as any)
        .remainingAccounts([
          {
            isSigner: false,
            isWritable: false,
            pubkey: getFakeAccounts(1, snapshotter.programId, "fake0")[0],
          },
          ...fakeAccountsRemainingAccounts,
        ])
        .rpc()

      let configData = await snapshotter.account.config.fetch(configKey)
      expect(configData.rootFinalized).to.be.eq(true)
      expect(configData.expectedBatch.toNumber()).to.be.eq(0)
      expect(configData.nonce.toNumber()).to.be.eq(1)
    })

    it("should calculate the root with 3 batches (10 + 10 + 1)", async () => {
      const [configKey] = PublicKey.findProgramAddressSync([Buffer.from("config", "utf-8")], snapshotter.programId)

      const alreadySubscribedFakeAccounts = getFakeAccounts(4, snapshotter.programId, "fake1")
      const newFakeAccounts = getFakeAccounts(16, snapshotter.programId, "fake2")
      for (const fakeAccount of newFakeAccounts) {
        await snapshotter.methods
          .subscribe(fakeAccount)
          .accounts({
            config: configKey,
          } as any)
          .rpc()
      }

      const fakeAccountsRemainingAccounts = [...alreadySubscribedFakeAccounts, ...newFakeAccounts].map(
        (_fakeAccount) => ({
          isSigner: false,
          isWritable: false,
          pubkey: _fakeAccount,
        }),
      )

      await snapshotter.methods
        .calculateRoot(new anchor.BN(0))
        .accounts({
          config: configKey,
        } as any)
        .remainingAccounts([
          {
            isSigner: false,
            isWritable: false,
            pubkey: getFakeAccounts(1, snapshotter.programId, "fake0")[0],
          },
          ...fakeAccountsRemainingAccounts.slice(0, 9),
        ])
        .rpc()

      let configData = await snapshotter.account.config.fetch(configKey)
      expect(configData.rootFinalized).to.be.eq(false)
      expect(configData.expectedBatch.toNumber()).to.be.eq(1)

      await snapshotter.methods
        .calculateRoot(new anchor.BN(1))
        .accounts({
          config: configKey,
        } as any)
        .remainingAccounts([...fakeAccountsRemainingAccounts.slice(9, 19)])
        .rpc()

      configData = await snapshotter.account.config.fetch(configKey)
      expect(configData.rootFinalized).to.be.eq(false)
      expect(configData.expectedBatch.toNumber()).to.be.eq(2)

      await snapshotter.methods
        .calculateRoot(new anchor.BN(2))
        .accounts({
          config: configKey,
        } as any)
        .remainingAccounts([...fakeAccountsRemainingAccounts.slice(19, 20)])
        .rpc()

      configData = await snapshotter.account.config.fetch(configKey)
      expect(configData.rootFinalized).to.be.eq(true)
      expect(configData.expectedBatch.toNumber()).to.be.eq(0)
      expect(configData.nonce.toNumber()).to.be.eq(2)
    })
  })
})
