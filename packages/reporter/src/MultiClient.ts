import { createWalletClient, http, Chain, Client } from "viem"
import { privateKeyToAccount } from "viem/accounts"

type ContructorConfigs = {
  chains: Chain[]
  privateKey: `0x${string}`
  rpcUrls: { [chainName: string]: string }
}

type GetClientsConfigs = {
  chain?: Chain | undefined
  privateKey: `0x${string}`
  rpcUrl: string
}

const getClient = ({ chain, privateKey, rpcUrl }: GetClientsConfigs) =>
  createWalletClient({
    account: privateKeyToAccount(privateKey),
    chain: chain as Chain | undefined,
    transport: http(rpcUrl),
  })

class Multiclient {
  private _clients: { [chainName: string]: Client }

  constructor({ chains, privateKey, rpcUrls }: ContructorConfigs) {
    this._clients = chains.reduce((_acc: { [chainName: string]: any }, _chain: Chain) => {
      const rpcUrl = rpcUrls[_chain.name]
      _acc[_chain.name] = getClient({ chain: _chain, privateKey, rpcUrl })
      return _acc
    }, {})
  }

  getClientByChain(_chain: Chain) {
    return this._clients[_chain.name]
  }
}

export default Multiclient
