import { ContractReceipt } from "ethers"

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
    const events = _receipt.events.filter(({ event }) => event === "MessageDispatched")
    const messages = events.map((_event) => _event.decode(_event?.data, _event?.topics))
    return messages.map(
      ({ data, from, messageId, to, toChainId }) => new Message({ data, from, messageId, to, toChainId }),
    )
  }

  get() {
    return [this.fromChainId, this.toChainId, this.from, this.to, this.data]
  }
}

export default Message
