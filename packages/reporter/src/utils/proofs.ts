import { AxiosInstance } from "axios"
import { capella, ssz, phase0 } from "@lodestar/types"
import { ProofType, createProof, SingleProof } from "@chainsafe/persistent-merkle-tree"
import { TransactionType } from "@ethereumjs/tx"
import { hexToBytes, concatBytes, bigIntToBytes, intToBytes } from "@ethereumjs/util"
import { TxReceipt, PostByzantiumTxReceipt, PreByzantiumTxReceipt } from "@ethereumjs/vm"
import { toHexString, fromHexString } from "@chainsafe/ssz"
import { RLP } from "@ethereumjs/rlp"
import { WalletClient, PublicClient, TransactionReceipt, Log } from "viem"
import { Trie } from "@ethereumjs/trie"

const SLOTS_PER_HISTORICAL_ROOT = 8192

export type BeaconId = number | Uint8Array | string

export const toStringFromBeaconId = (identifier: BeaconId) => {
  if (identifier instanceof Uint8Array) {
    return toHexString(identifier)
  }
  return identifier.toString()
}

export const getState = async (_stateId: BeaconId, _client: AxiosInstance): Promise<capella.BeaconState> => {
  const { data } = await _client.get(`/eth/v2/debug/beacon/states/${toStringFromBeaconId(_stateId)}`)
  return ssz.capella.BeaconState.fromJson(data.data) as capella.BeaconState
}

export const getHeader = async (_blockId: BeaconId, _client: AxiosInstance): Promise<phase0.BeaconBlockHeader> => {
  const { data } = await _client.get(`/eth/v1/beacon/headers/${toStringFromBeaconId(_blockId)}`)
  return ssz.phase0.BeaconBlockHeader.fromJson(data.data.header.message)
}

export const getReceiptsRootProof = async (_srcBlockId: BeaconId, _targetBlockId: BeaconId, _client: AxiosInstance) => {
  const srcState = await getState(toStringFromBeaconId(_srcBlockId), _client)
  const targetState = await getState(toStringFromBeaconId(_targetBlockId), _client)

  const srcView = ssz.capella.BeaconState.toView(srcState as capella.BeaconState)
  const targetView = ssz.capella.BeaconState.toView(targetState as capella.BeaconState)
  const srcSlot = srcState.slot
  const targetSlot = targetState.slot

  const srcHeader = await getHeader(_srcBlockId, _client)
  const srcHeaderView = ssz.phase0.BeaconBlockHeader.toView(srcHeader as phase0.BeaconBlockHeader)

  let receiptsRootProof
  let receiptsRoot
  if (srcSlot == targetSlot) {
    const receiptGindex = ssz.capella.BeaconState.getPathInfo(["latestExecutionPayloadHeader", "receiptsRoot"]).gindex
    const receiptProof = createProof(targetView.node, {
      type: ProofType.single,
      gindex: receiptGindex,
    }) as SingleProof
    receiptsRootProof = receiptProof.witnesses.map(toHexString)
    receiptsRoot = toHexString(receiptProof.leaf)
  } else if (srcSlot - targetSlot < 8192) {
    const headerGindex = ssz.phase0.BeaconBlockHeader.getPathInfo(["stateRoot"]).gindex
    const headerProof = createProof(srcHeaderView.node, {
      type: ProofType.single,
      gindex: headerGindex,
    }) as SingleProof

    const stateRootGindex = ssz.capella.BeaconState.getPathInfo([
      "stateRoots",
      targetSlot % SLOTS_PER_HISTORICAL_ROOT,
    ]).gindex
    const proof = createProof(srcView.node, {
      type: ProofType.single,
      gindex: stateRootGindex,
    }) as SingleProof

    const receiptGindex = ssz.capella.BeaconState.getPathInfo(["latestExecutionPayloadHeader", "receiptsRoot"]).gindex
    const receiptProof = createProof(targetView.node, {
      type: ProofType.single,
      gindex: receiptGindex,
    }) as SingleProof
    receiptsRootProof = receiptProof.witnesses.concat(proof.witnesses).concat(headerProof.witnesses).map(toHexString)
    receiptsRoot = toHexString(receiptProof.leaf)
  } else {
    throw Error("slots are too far")
  }
  return { receiptsRootProof, receiptsRoot }
}

// copied from here: https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/vm/src/runBlock.ts
export const encodeReceipt = (receipt: TxReceipt, txType: TransactionType) => {
  const encoded = RLP.encode([
    (receipt as PreByzantiumTxReceipt).stateRoot ??
      ((receipt as PostByzantiumTxReceipt).status === 0 ? Uint8Array.from([]) : hexToBytes("0x01")),
    bigIntToBytes(receipt.cumulativeBlockGasUsed),
    receipt.bitvector,
    receipt.logs,
  ])

  if (txType === TransactionType.Legacy) {
    return encoded
  }

  // Serialize receipt according to EIP-2718:
  // `typed-receipt = tx-type || receipt-data`
  return concatBytes(intToBytes(txType), encoded)
}

export const getReceiptProof = async (_hash: `0x${string}`, _client: PublicClient & WalletClient) => {
  const receipt = await _client.getTransactionReceipt({ hash: _hash })
  const block = await _client.getBlock({ blockNumber: receipt.blockNumber })
  const receipts = [] as TransactionReceipt[]
  for (const hash of block.transactions) {
    receipts.push(await _client.getTransactionReceipt({ hash }))
  }

  const trie = new Trie()
  const encodedReceipts = receipts.map((_receipt) => {
    let type = 0
    if (_receipt.type == "eip2930") {
      type = 1
    } else if (_receipt.type == "eip1559") {
      type = 2
    } else if (_receipt.type != "legacy") {
      throw Error(`Unknown receipt type ${_receipt.type}`)
    }

    return encodeReceipt(
      {
        bitvector: fromHexString(_receipt.logsBloom),
        cumulativeBlockGasUsed: BigInt(_receipt.cumulativeGasUsed),
        logs: _receipt.logs.map((_log: Log) => {
          return [
            fromHexString(_log.address),
            _log.topics.map((_topic: `0x${string}`) => fromHexString(_topic)),
            fromHexString(_log.data),
          ]
        }),
        status: _receipt.status === "success" ? 1 : 0,
      } as TxReceipt,
      type,
    )
  })

  await Promise.all(
    receipts.map((_receipt, _index) => trie.put(RLP.encode(_receipt.transactionIndex), encodedReceipts[_index])),
  )
  const receiptKey = RLP.encode(receipt.transactionIndex)

  const root = toHexString(trie.root())
  if (root !== block.receiptsRoot) {
    throw Error("The trie.root() and block.receiptsRoot do not match")
  }

  return { receiptProof: await trie.createProof(receiptKey), receiptsRoot: block.receiptsRoot }
}
