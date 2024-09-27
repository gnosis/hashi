import "dotenv/config"
import { ethers } from "ethers"
import { logger } from "@gnosis/hashi-common"
import { Block } from "@ethereumjs/block"
import { loadKZG } from "kzg-wasm"
import { Common, Chain, Hardfork } from "@ethereumjs/common"
import { RLP } from "@ethereumjs/rlp"
import { bigIntToHex, bytesToHex } from "@ethereumjs/util"

import {
  GetAccountAndStorageProofParams,
  GetAccountAndStorageProofResponse,
} from "../types"

const getAccountAndStorageProof = async ({
  address,
  ancestralBlockNumber = 0,
  blockNumber,
  chainId,
  storageKeys
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
      provider.send("eth_getProof", [address, storageKeys, bigIntToHex(BigInt(ancestralBlockNumber || blockNumber))]),
      Block.fromJsonRpcProvider(provider, BigInt(blockNumber), { common }),
    ])


    let ancestralBlockHeaders = [] as `0x${string}`[]
    if (ancestralBlockNumber !== 0) {
      if (ancestralBlockNumber >= blockNumber) throw new Error("Invalid ancestral block number")
      
        const blockNumbers = [...Array(blockNumber - ancestralBlockNumber + 1).keys()].map(num => num + ancestralBlockNumber)
        ancestralBlockHeaders = (await Promise.all(
          blockNumbers.map(_blockNumber => Block.fromJsonRpcProvider(provider, BigInt(_blockNumber), { common }),)
        )).map(_block => bytesToHex(_block.header.serialize())).reverse()
    }



    return {
      proof: [
        chainId,
        blockNumber,
        bytesToHex(block.header.serialize()),
        ancestralBlockNumber,
        ancestralBlockHeaders,
        address,
        bytesToHex(RLP.encode(proof.accountProof.map((_sibling: string) => RLP.decode(_sibling)))),
        proof.storageHash,
        proof.storageProof.map(({ key }: any) => key),
        proof.storageProof.map(({ proof: storageProof }: any) =>
          bytesToHex(RLP.encode(storageProof.map((_sibling: string) => RLP.decode(_sibling)))),
        )
      ],
    } as GetAccountAndStorageProofResponse
  } catch (_err) {
    logger.error(_err)
    throw _err
  }
}

export default getAccountAndStorageProof
