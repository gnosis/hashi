import axios from "axios"
import { RLP } from "@ethereumjs/rlp"
import { bytesToHex } from "@ethereumjs/util"
import { Chain, encodeAbiParameters } from "viem"
import { Mutex } from "async-mutex"

import { getReceiptsRootProof, getReceiptProof } from "../utils/proofs.js"
import HeaderStorageABI from "../ABIs/HeaderStorageABI.json" assert { type: "json" }
import AdapterContractABI from "../ABIs/ElectronAdapterABI.json" assert { type: "json" }
import ElectronLightClientABI from "../ABIs/ElectronLightClientABI.json" assert { type: "json" }
import BaseController from "./BaseController.js"
import { BaseControllerConfigs } from "./BaseController.js"
import sleep from "../utils/sleep.js"

const EXPECTED_TOPIC = "0xf7df17dce0093aedfcbae24b4f04e823f9e863c97986ab1ba6c5267ace49ddea" //HeaderStored(uint256,bytes32)

interface TelepathyReporterControllerConfigs extends BaseControllerConfigs {
  headerStorageAddress: `0x${string}`
  lightClientAddresses: { [chainName: string]: `0x${string}` }
  beaconchaBaseUrl: string
  beaconApiBaseUrl: string
}

class ElectronReporterController extends BaseController {
  headerStorageAddress: `0x${string}`
  lastProcessedBlock: bigint
  lightClientAddresses: { [chainName: string]: `0x${string}` }
  private _mutex: Mutex
  private _beaconchaBaseUrl: string
  private _beaconApiBaseUrl: string

  constructor(_configs: TelepathyReporterControllerConfigs) {
    super(_configs, "ElectronReporterController")

    this.headerStorageAddress = _configs.headerStorageAddress
    this.lightClientAddresses = _configs.lightClientAddresses
    this._beaconchaBaseUrl = _configs.beaconchaBaseUrl
    this._beaconApiBaseUrl = _configs.beaconApiBaseUrl
    this.lastProcessedBlock = 0n
    this._mutex = new Mutex()
  }

  async update() {
    const release = await this._mutex.acquire()
    try {
      if (!this.headerStorageAddress || this.destinationChains?.length === 0) {
        release()
        return
      }

      const sourceClient = this.multiClient.getClientByChain(this.sourceChain)
      const blockNumber = await sourceClient.getBlockNumber()

      this.logger.info(`storing a block header for block ${blockNumber - 1n} on ${this.sourceChain.name} ...`)
      const { request } = await sourceClient.simulateContract({
        address: this.headerStorageAddress as `0x${string}`,
        abi: HeaderStorageABI,
        functionName: "storeBlockHeader",
        args: [blockNumber - 1n],
      })

      const hash = await sourceClient.writeContract(request)
      this.logger.info(
        `header reported from ${this.sourceChain.name} to ${
          this.destinationChains![0].name
        }: ${hash} Waiting for the receipt ...`,
      )
      const receipt = await sourceClient.waitForTransactionReceipt({ hash })

      this.logger.info("Calculating receipt proof ...")
      const { receiptProof, receiptsRoot } = await getReceiptProof(hash, sourceClient)

      this.logger.info("Getting log index ...")
      const logIndex = receipt.logs.findIndex(
        ({ address, topics }) =>
          address.toLowerCase() === this.headerStorageAddress.toLowerCase() && topics[0] === EXPECTED_TOPIC,
      )

      this.logger.info("Getting transaction slot ...")
      let transactionSlot
      while (true) {
        try {
          this.logger.info("Waiting for finality ...")
          const {
            data: { data },
          } = await axios.get(`${this._beaconchaBaseUrl}/api/v1/execution/block/${receipt.blockNumber}`)
          const [
            {
              posConsensus: { slot, finalized },
            },
          ] = data
          if (finalized) {
            transactionSlot = slot
            break
          }
          await sleep(10000)
        } catch (_err) {
          await sleep(10000)
        }
      }

      const proof = {
        lcSlotTxSlotPack: "0x" as `0x${string}`,
        logIndex: BigInt(logIndex),
        receiptProof: receiptProof.map((_el) => bytesToHex(_el)) as `0x${string}`[],
        receiptsRoot,
        receiptsRootProof: [] as string[],
        txIndexRLP: ("0x" + Buffer.from(RLP.encode(receipt.transactionIndex)).toString("hex")) as `0x${string}`,
      }

      for (const chain of this.destinationChains as Chain[]) {
        const destinationClient = this.multiClient.getClientByChain(chain)
        const lightClientSlot: bigint = (await destinationClient.readContract({
          address: this.lightClientAddresses[chain.name],
          abi: ElectronLightClientABI,
          functionName: "head",
          args: [],
        })) as bigint

        // TODO: check that head is greater than transactionSlot

        proof.lcSlotTxSlotPack = encodeAbiParameters(
          [{ type: "uint64" }, { type: "uint64" }],
          [lightClientSlot, transactionSlot],
        )

        this.logger.info("Calculating receipts root proof ...")
        const { receiptsRootProof } = await getReceiptsRootProof(
          Number(lightClientSlot),
          Number(transactionSlot),
          axios.create({
            baseURL: this._beaconApiBaseUrl,
            responseType: "json",
            headers: { "Content-Type": "application/json" },
          }),
        )
        proof.receiptsRootProof = receiptsRootProof

        const encodedProof = encodeAbiParameters(
          [
            { type: "bytes" },
            { type: "bytes32[]" },
            { type: "bytes32" },
            { type: "bytes[]" },
            { type: "bytes" },
            { type: "uint256" },
          ],
          [
            proof.lcSlotTxSlotPack,
            proof.receiptsRootProof as `0x${string}`[],
            proof.receiptsRoot,
            proof.receiptProof,
            proof.txIndexRLP,
            proof.logIndex,
          ],
        )

        this.logger.info(`Storing block header for ${blockNumber} on contract ${chain.name} ...`)
        const { request } = await destinationClient.simulateContract({
          address: this.adapterAddresses[chain.name],
          abi: AdapterContractABI,
          functionName: "storeHash",
          args: [encodedProof],
        })
        const txHash = await destinationClient.writeContract(request)
        this.logger.info(`tx sent on ${chain.name}: ${txHash}`)
      }
      this.lastProcessedBlock = blockNumber
    } catch (_error) {
      this.logger.error(_error)
    } finally {
      release()
    }
  }
}

export default ElectronReporterController
