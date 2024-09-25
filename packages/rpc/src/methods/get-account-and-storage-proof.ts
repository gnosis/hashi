import "dotenv/config"
import { ethers } from "ethers"
import { logger } from "@gnosis/hashi-common"
import { Block } from "@ethereumjs/block"
import { loadKZG } from "kzg-wasm"
import { Common, Chain, Hardfork } from "@ethereumjs/common"
import { RLP } from "@ethereumjs/rlp"
import { bigIntToHex, bytesToHex } from "@ethereumjs/util"

import {
  AccountProof,
  StorageProof,
  GetAccountAndStorageProofParams,
  GetAccountAndStorageProofResponse,
} from "../types"

const getAccountAndStorageProof = async ({
  chainId,
  address,
  storageKeys,
  blockNumber,
}: GetAccountAndStorageProofParams) => {
  try {
    const rpcUrl = process.env[`JSON_RPC_URL_${chainId}`]
    if (!rpcUrl) throw new Error("Chain not supported")

    const kzg = await loadKZG()
    const common = new Common({
      chain: Chain.Mainnet,
      hardfork: Hardfork.Cancun,
      customCrypto: {
        kzg,
      },
    })

    const provider = new ethers.JsonRpcProvider(rpcUrl)

    const [proof, block] = await Promise.all([
      provider.send("eth_getProof", [address, storageKeys, bigIntToHex(BigInt(blockNumber))]),
      Block.fromJsonRpcProvider(provider, BigInt(blockNumber), { common }),
    ])

    return {
      accountProof: [
        address,
        bytesToHex(RLP.encode(proof.accountProof.map((_sibling: string) => RLP.decode(_sibling)))),
        bytesToHex(block.header.serialize()),
        chainId,
      ] as AccountProof,
      storageProof: [
        proof.storageHash,
        proof.storageProof.map(({ key }: any) => key),
        proof.storageProof.map(({ proof: storageProof }: any) =>
          bytesToHex(RLP.encode(storageProof.map((_sibling: string) => RLP.decode(_sibling)))),
        ),
        bytesToHex(block.header.serialize()),
        chainId,
      ] as StorageProof,
    } as GetAccountAndStorageProofResponse
  } catch (_err) {
    logger.error(_err)
    throw _err
  }
}

export default getAccountAndStorageProof
