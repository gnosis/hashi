// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

import { Program, Provider } from "@coral-xyz/anchor"
import * as anchor from "@coral-xyz/anchor"
import { PublicKey, PublicKeyInitData } from "@solana/web3.js"
import { CONTRACTS } from "@certusone/wormhole-sdk"
import { getPostMessageCpiAccounts } from "@certusone/wormhole-sdk/lib/cjs/solana/wormhole"
import { deriveAddress } from "@certusone/wormhole-sdk/lib/cjs/solana"

import { WormholeReporter } from "../target/types/wormhole_reporter"
import { Snapshotter } from "../target/types/snapshotter"
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system"

const deriveWormholeMessageKey = (_programId: PublicKeyInitData, _sequence: bigint) => {
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

module.exports = async (provider: Provider) => {
  anchor.setProvider(provider)

  // snapshotter
  /*const snapshotter = anchor.workspace.Snapshotter as Program<Snapshotter>
  const [configKey] = PublicKey.findProgramAddressSync([Buffer.from("config", "utf-8")], snapshotter.programId)
  let tx = await snapshotter.methods
    .initialize()
    .accounts({
      owner: provider.publicKey,
      config: configKey,
      systemProgram: SYSTEM_PROGRAM_ID,
    } as any)
    .rpc()
  console.log("initialize tx:", tx)
  tx = await snapshotter.methods
    .subscribe(snapshotter.programId)
    .accounts({
      config: configKey,
    })
    .rpc()
  console.log("subscribe tx:", tx)
  tx = await snapshotter.methods
    .calculateRoot(new anchor.BN(0))
    .accounts({
      config: configKey,
    })
    .remainingAccounts([
      {
        isSigner: false,
        isWritable: false,
        pubkey: snapshotter.programId,
      },
    ])
    .rpc()
  console.log("calculate_root tx:", tx)*/

  // wormhole_reporter
  /*const reporter = anchor.workspace.WormholeReporter as Program<WormholeReporter>
  const snapshotter = anchor.workspace.Snapshotter as Program<Snapshotter>
  const coreBridgePid = new PublicKey(CONTRACTS.TESTNET.solana.core)

  const message = deriveWormholeMessageKey(reporter.programId, 1n)
  const wormholeAccounts = getPostMessageCpiAccounts(
    reporter.programId,
    coreBridgePid,
    provider.publicKey as PublicKey,
    message,
  )
  const [reporterConfigKey] = PublicKey.findProgramAddressSync([Buffer.from("config", "utf-8")], reporter.programId)
  const [snapshotterConfigKey] = PublicKey.findProgramAddressSync(
    [Buffer.from("config", "utf-8")],
    snapshotter.programId,
  )
  const tx = await reporter.methods
    .initialize()
    .accounts({
      owner: provider.publicKey,
      config: reporterConfigKey,
      snapshotterConfig: snapshotterConfigKey,
      wormholeProgram: new PublicKey(coreBridgePid),
      ...wormholeAccounts,
    } as any)
    .rpc()
  console.log(tx)*/
}
