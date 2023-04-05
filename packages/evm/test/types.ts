import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address"

import type { GiriGiriBashi } from "../types/contracts/GiriGiriBashi"
import type { Hashi } from "../types/contracts/Hashi"

type Fixture<T> = () => Promise<T>

declare module "mocha" {
  export interface Context {
    hashi: Hashi
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>
    signers: Signers
  }
  export interface Context {
    giriGiriBashi: GiriGiriBashi
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>
    signers: Signers
  }
}

export interface Signers {
  admin: SignerWithAddress
}
