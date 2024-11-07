import {
  GetAccountAndStorageProofParams,
  GetAccountAndStorageProofResponse,
  GetReceiptProofParams,
  GetReceiptProofResponse,
} from "../types"

export type Methods = {
  hashi_getAccountAndStorageProof(params: GetAccountAndStorageProofParams): GetAccountAndStorageProofResponse
  hashi_getReceiptProof(params: GetReceiptProofParams): GetReceiptProofResponse
}
