import { ContractReceipt } from "ethers"

type Configs = {
  data: string
  sender: `0x${string}`
  threshold: number
  id: string
  receiver: `0x${string}`
  targetChainId: number
  salt: string
  reporters: `0x${string}`[]
  adapters: `0x${string}`[]
}

class Message {
  public data: string
  public sender: `0x${string}`
  public threshold: number
  public id: string
  public receiver: `0x${string}`
  public targetChainId: number
  public salt: string
  public reporters: `0x${string}`[]
  public adapters: `0x${string}`[]

  constructor({ data, sender, threshold, id, receiver, targetChainId, salt, reporters, adapters }: Configs) {
    this.id = id
    this.sender = sender
    this.targetChainId = targetChainId
    this.receiver = receiver
    this.data = data
    this.salt = salt
    this.reporters = reporters
    this.adapters = adapters
    this.threshold = threshold
  }

  static fromReceipt(_receipt: ContractReceipt) {
    const events = _receipt.events.filter(({ event }) => event === "MessageDispatched")
    return events.map(({ args: { messageId, message } }) => new Message({ id: messageId, ...message }))
  }

  serialize() {
    return [
      this.salt,
      this.targetChainId,
      this.threshold,
      this.sender,
      this.receiver,
      this.data,
      this.reporters,
      this.adapters,
    ]
  }
}

export default Message
