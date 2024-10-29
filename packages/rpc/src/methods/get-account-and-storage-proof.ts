import "dotenv/config"
import { ethers } from "ethers"
import { logger } from "@gnosis/hashi-common"
import { BlockHeader, JsonRpcBlock } from "@ethereumjs/block"
import { Common, Hardfork } from "@ethereumjs/common"
import {
  bigIntToHex,
  bytesToHex,
  intToHex,
} from "@ethereumjs/util"

import { GetAccountAndStorageProofParams, GetAccountAndStorageProofResponse } from "../types"

export function blockHeaderFromRpc(_block: JsonRpcBlock) {
  const {
    parentHash,
    sha3Uncles,
    miner,
    stateRoot,
    transactionsRoot,
    receiptsRoot,
    logsBloom,
    difficulty,
    number,
    gasLimit,
    gasUsed,
    timestamp,
    extraData,
    mixHash,
    nonce,
    baseFeePerGas,
    withdrawalsRoot,
    blobGasUsed,
    excessBlobGas,
    parentBeaconBlockRoot,
    requestsRoot,
  } = _block

  return {
    parentHash,
    uncleHash: sha3Uncles,
    coinbase: miner,
    stateRoot,
    transactionsTrie: transactionsRoot,
    receiptTrie: receiptsRoot,
    logsBloom,
    difficulty,
    number,
    gasLimit,
    gasUsed,
    timestamp,
    extraData,
    mixHash,
    nonce,
    baseFeePerGas,
    withdrawalsRoot,
    blobGasUsed,
    excessBlobGas,
    parentBeaconBlockRoot,
    requestsRoot,
  }
}

const getAccountAndStorageProof = async ({
  address,
  ancestralBlockNumber = 0,
  blockNumber,
  chainId,
  storageKeys,
}: GetAccountAndStorageProofParams) => {
  try {
    const rpcUrl = process.env[`JSON_RPC_URL_${chainId}`]
    if (!rpcUrl) throw new Error("Chain not supported")

    const common = Common.custom(
      {
        chainId,
      },
      {
        hardfork: Hardfork.Cancun,
        eips: [1559, 4895, 4844, 4788],
      },
    )

    const provider = new ethers.JsonRpcProvider(rpcUrl)
    
    const [proof, block] = await Promise.all([
      provider.send("eth_getProof", [address, storageKeys, bigIntToHex(BigInt(ancestralBlockNumber || blockNumber))]),
      provider.send("eth_getBlockByNumber", [intToHex(blockNumber), false]),
    ])
    const blockHeader = BlockHeader.fromHeaderData(blockHeaderFromRpc(block), { common })

    let ancestralBlockHeaders = [] as `0x${string}`[]
    if (ancestralBlockNumber !== 0) {
      if (ancestralBlockNumber >= blockNumber) throw new Error("Invalid ancestral block number")

      const blockNumbers = [...Array(blockNumber - ancestralBlockNumber + 1).keys()].map(
        (num) => num + ancestralBlockNumber,
      )
      ancestralBlockHeaders = (
        await Promise.all(
          blockNumbers.map((_blockNumber) => provider.send("eth_getBlockByNumber", [intToHex(_blockNumber), false])),
        )
      )
        .map((_block) => bytesToHex(BlockHeader.fromHeaderData(blockHeaderFromRpc(_block), { common }).serialize()))
        .reverse()
    }

    return {
      proof: [
        chainId,
        blockNumber,
        bytesToHex(blockHeader.serialize()),
        ancestralBlockNumber,
        ancestralBlockHeaders,
        address,
        proof.accountProof,
        proof.storageHash,
        proof.storageProof.map(({ key }: any) => key),
        proof.storageProof.map(({ proof: storageProof }: any) => storageProof),
      ],
    } as GetAccountAndStorageProofResponse
  } catch (_err) {
    logger.error(_err)
    throw _err
  }
}

export default getAccountAndStorageProof
