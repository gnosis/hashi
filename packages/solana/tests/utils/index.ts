import { PublicKey } from "@solana/web3.js"

export const intToBytes32Buff = (_num: number) => Buffer.from(_num.toString(16).padStart(64, "0"), "hex")

export const getFakeAccounts = (_length: number, _programId: PublicKey, _salt: string) =>
  [...Array(_length).keys()]
    .map((_, _index) =>
      PublicKey.findProgramAddressSync([Buffer.from(_salt, "utf-8"), Buffer.from(_index.toString())], _programId),
    )
    .map(([publicKey]) => publicKey)
