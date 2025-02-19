import "dotenv/config"
import { ethers, Log } from "ethers"
import { logger } from "@gnosis/hashi-common"
import { Trie } from "@ethereumjs/trie"
import { bytesToHex, concatBytes, hexToBigInt, hexToBytes, intToBytes, bytesToInt, intToHex } from "@ethereumjs/util"
import { RLP } from "@ethereumjs/rlp"
import { BlockHeader } from "@ethereumjs/block"

import { blockHeaderFromRpc } from "../utils/block"
import getCommon from "../utils/common"

import { GetReceiptProofParams, GetReceiptProofResponse } from "../types"

const encodeIndex = (_index: `0x${string}`) =>
  _index === "0x0" ? RLP.encode(Buffer.alloc(0)) : RLP.encode(bytesToInt(hexToBytes(_index ?? "0x0")))

const getReceiptProof = async ({ logIndex, blockNumber, chainId, transactionHash }: GetReceiptProofParams) => {
  try {
    const rpcUrl = process.env[`JSON_RPC_URL_${chainId}`]
    if (!rpcUrl) throw new Error("Chain not supported")
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    const common = getCommon(chainId)

    const targetTransactionReceipt = await provider.send("eth_getTransactionReceipt", [transactionHash])
    if (!targetTransactionReceipt) throw new Error("Receipt not found")

    const hexLogIndex = intToHex(logIndex)
    const log = targetTransactionReceipt.logs.find((_log: any) => _log.logIndex === hexLogIndex)

    if (!log) throw new Error(`Log ${logIndex} not found within the specified transaction`)
    const effectiveLogIndex = targetTransactionReceipt.logs.findIndex((_log: any) => _log.logIndex === hexLogIndex)

    const blockContainingLog = await provider.send("eth_getBlockByHash", [targetTransactionReceipt.blockHash, true])
    const blockHeader = BlockHeader.fromHeaderData(blockHeaderFromRpc(blockContainingLog), { common })
    const blockContainingLogNumber = Number(hexToBigInt(blockContainingLog.number))
    if (blockNumber && blockNumber <= blockContainingLogNumber)
      throw new Error("blockNumber must be greater than transaction.blockNumber")

    let receipts = []
    for (const transaction of blockContainingLog.transactions) {
      receipts.push(await provider.send("eth_getTransactionReceipt", [transaction.hash]))
    }

    const encodedReceipts = receipts.map((_receipt, _index) => {
      let type = Number(hexToBigInt(_receipt.type))
      if (type === 126) {
        // Optimism DepositTxType
        const encoded = RLP.encode([
          _receipt.status === "0x1" ? "0x1" : "0x",
          _receipt.cumulativeGasUsed,
          _receipt.logsBloom,
          _receipt.logs.map((_log: Log) => {
            return [_log.address, _log.topics, _log.data]
          }),
          _receipt.depositNonce,
          _receipt.depositReceiptVersion,
        ])
        return concatBytes(intToBytes(126), encoded)
      }

      const encoded = RLP.encode([
        _receipt.status === "0x1" ? hexToBytes("0x01") : Uint8Array.from([]),
        hexToBytes(_receipt.cumulativeGasUsed),
        hexToBytes(_receipt.logsBloom),
        _receipt.logs.map((_log: Log) => {
          return [hexToBytes(_log.address), _log.topics.map(hexToBytes), hexToBytes(_log.data)]
        }),
      ])
      if (type === 0) return encoded
      return concatBytes(intToBytes(type), encoded)
    })

    const trie = new Trie()
    await Promise.all(
      receipts.map((_receipt, _index) => trie.put(encodeIndex(_receipt.transactionIndex), encodedReceipts[_index])),
    )

    //
    const root = bytesToHex(trie.root())
    if (root !== blockContainingLog.receiptsRoot) {
      throw Error("The trie.root() and blockContainingLog.receiptsRoot do not match")
    }

    // If a blockNumber is specified, we need to retrieve the chain from blockNumber to blockContainingLog.number, as this indicates that
    // Hashi has the block number, and the block where the transaction occurred is an ancestor of blockNumber.
    let ancestralBlockHeaders = [] as `0x${string}`[]
    if (blockNumber) {
      let ancestralBlockNumber = Number(hexToBigInt(blockContainingLog.number))
      if (ancestralBlockNumber >= blockNumber) throw new Error("Invalid ancestral blockContainingLog number")

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

    const receiptKey = encodeIndex(targetTransactionReceipt!.transactionIndex)
    const proof = await trie.createProof(receiptKey)

    return {
      proof: [
        chainId,
        blockNumber ? blockNumber : blockContainingLogNumber,
        bytesToHex(blockHeader.serialize()),
        blockNumber ? blockContainingLogNumber : 0,
        ancestralBlockHeaders,
        proof.map(bytesToHex),
        bytesToHex(encodeIndex(targetTransactionReceipt.transactionIndex)),
        effectiveLogIndex,
      ],
    } as GetReceiptProofResponse
  } catch (_err) {
    logger.error(_err)
    throw _err
  }
}

export default getReceiptProof
