import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address"

import type { Hashi } from "../types/contracts/Hashi"
import type { ShoyuBashi } from "../types/contracts/ShoyuBashi"

type Fixture<T> = () => Promise<T>

declare module "mocha" {
  export interface Context {
    hashi: Hashi
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>
    signers: Signers
  }
  export interface Context {
    shoyuBashi: ShoyuBashi
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>
    signers: Signers
  }
}

export interface Signers {
  admin: SignerWithAddress
}
