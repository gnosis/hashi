import axios, { AxiosInstance } from "axios"
import { Mutex } from "async-mutex"
import { Chain } from "viem"

import BaseController from "./BaseController"
import sleep from "../utils/sleep"
import wormholeReporterAbi from "../abi/wormholeReporter"
import wormholeAdapterAbi from "../abi/wormholeAdapter"
import wormholeAbi from "../abi/wormhole"

import { BaseControllerConfigs } from "./BaseController"

interface WormholeReporterControllerConfigs extends BaseControllerConfigs {
  wormholeScanBaseUrl: string
  wormholeAddress: `0x${string}`
  wormholeChainIds: { [chainName: string]: number }
}

class WormholeReporterController extends BaseController {
  private _wormholeAddress: `0x${string}`
  private _wormholeScanClient: AxiosInstance
  private _wormholeChainIds: { [chainName: string]: number }
  private _mutex: Mutex

  constructor(_configs: WormholeReporterControllerConfigs) {
    super(_configs, "WormholeReporterController")
    this._wormholeScanClient = axios.create({ baseURL: _configs.wormholeScanBaseUrl })
    this._mutex = new Mutex()
    this._wormholeAddress = _configs.wormholeAddress
    this._wormholeChainIds = _configs.wormholeChainIds
  }

  async onBlocks(_blockNumbers: bigint[]) {
    const release = await this._mutex.acquire()

    try {
      const wormholeChainId = this._wormholeChainIds[this.sourceChain.name]
      const client = this.multiClient.getClientByChain(this.sourceChain)
      const blockNumber = _blockNumbers[_blockNumbers.length - 1]

      const nextSequence = await client.readContract({
        address: this._wormholeAddress as `0x${string}`,
        abi: wormholeAbi,
        functionName: "nextSequence",
        args: [this.reporterAddress],
      })

      this.logger.info(`reporting block header for block ${blockNumber} ...`)
      const { request } = await client.simulateContract({
        address: this.reporterAddress as `0x${string}`,
        abi: wormholeReporterAbi,
        functionName: "dispatchBlocks",
        // targetChainId & adapter are not used in _dispatch(), here set to 0
        args: [0, "0x0000000000000000000000000000000000000000", [blockNumber]],
      })

      let txHash = await client.writeContract(request)
      this.logger.info(`header reported from ${this.sourceChain.name} to Wormhole Network: ${txHash}`)

      let vaaBytes = null
      let sequence = Number(nextSequence)

      while (true) {
        try {
          this.logger.info("Waiting for signed VAA ...")

          const { data } = await this._wormholeScanClient.get(
            `v1/signed_vaa/${wormholeChainId}/000000000000000000000000${this.reporterAddress?.slice(2)}/${sequence}`,
          )

          vaaBytes = "0x" + Buffer.from(data.vaaBytes, "base64").toString("hex")
          this.logger.info("Signed VAA available! Proceeding ...")
          break
        } catch (_err) {
          this.logger.info("VAA not available yet ...")
        }
        await sleep(20000)
      }

      for (const chain of this.destinationChains as Chain[]) {
        if (!this.adapterAddresses[chain.name]) continue

        const destinationChainClient = this.multiClient.getClientByChain(chain)

        this.logger.info(`Storing header on ${chain.name} ...`)
        const { request } = await destinationChainClient.simulateContract({
          address: this.adapterAddresses[chain.name],
          abi: wormholeAdapterAbi,
          functionName: "storeHashesByEncodedVM",
          args: [vaaBytes],
        })

        txHash = await destinationChainClient.writeContract(request)
        this.logger.info(`Header stored on ${chain.name}: ${txHash}!`)
      }
    } catch (_error) {
      this.logger.error(_error)
    } finally {
      release()
    }
  }
}

export default WormholeReporterController
