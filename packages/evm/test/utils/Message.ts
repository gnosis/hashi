import { ContractReceipt, ethers } from "ethers"

import { Chains } from "../constants"

type Configs = {
  data: string
  from: `0x${string}`
  messageId: string
  to: `0x${string}`
  fromChainId: number
  toChainId: number
}

class Message {
  public id
  public from
  public to
  public toChainId
  public fromChainId
  public data

  constructor({ data, from, fromChainId = Chains.Hardhat, messageId, to, toChainId }: Configs) {
    this.id = messageId
    this.from = from
    this.toChainId = toChainId
    this.to = to
    this.data = data
    this.fromChainId = fromChainId
  }

  static fromReceipt(_receipt: ContractReceipt) {
    const abi = [
      "event MessageDispatched(bytes32 indexed messageId,address indexed from,uint256 indexed toChainId,address to,bytes data)",
    ]
    const iface = new ethers.utils.Interface(abi)
    const logs = _receipt.logs.filter(
      ({ topics }) => topics[0] === "0xe2f8f20ddbedfce5eb59a8b930077e7f4906a01300b9318db5f90d1c96c7b6d4",
    )
    const messages = logs.map(({ topics, data }) => iface.parseLog({ topics, data }))
    return messages.map(
      ({ args: { data, from, messageId, to, toChainId } }) => new Message({ data, from, messageId, to, toChainId }),
    )
  }

  get() {
    return [this.fromChainId, this.toChainId, this.from, this.to, this.data]
  }
}

export default Message
