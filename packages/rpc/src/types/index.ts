export type AccountProof = [`0x${string}`, `0x${string}`, `0x${string}`, number]

export type StorageProof = [`0x${string}`, `0x${string}`[], `0x${string}`[], `0x${string}`, number]

export type GetAccountAndStorageProofParams = {
  chainId: number
  address: `0x${string}`
  storageKeys: `0x${string}`[]
  blockNumber: number
}

export type GetAccountAndStorageProofResponse = {
  accountProof: AccountProof
  storageProof: StorageProof
}
