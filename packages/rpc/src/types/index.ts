export type AccountAndStorageProof = [
  number,
  number,
  `0x${string}`,
  number,
  `0x${string}`[],
  `0x${string}`,
  `0x${string}`,
  `0x${string}`,
  `0x${string}`[],
  `0x${string}`,
]

export type ReceiptProof = [
  number,
  number,
  `0x${string}`,
  number,
  `0x${string}`[],
  `0x${string}`[],
  `0x${string}`,
  number,
]

export type GetAccountAndStorageProofParams = {
  address: `0x${string}`
  ancestralBlockNumber?: number
  blockNumber: number
  chainId: number
  storageKeys: `0x${string}`[]
}

export type GetAccountAndStorageProofResponse = {
  proof: AccountAndStorageProof
}

export type GetReceiptProofParams = {
  blockNumber: number
  chainId: number
  logIndex: number
  transactionHash: `0x${string}`
}

export type GetReceiptProofResponse = {
  proof: ReceiptProof
}
