import { ContractReceipt, utils } from "ethers"

type Configs = {
  data: string
  sender: `0x${string}`
  threshold: number
  id: string
  receiver: `0x${string}`
  targetChainId: number
  nonce: number
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
  public nonce: number
  public reporters: `0x${string}`[]
  public adapters: `0x${string}`[]

  constructor({ data, sender, threshold, id, receiver, targetChainId, nonce, reporters, adapters }: Configs) {
    this.id = id
    this.sender = sender
    this.targetChainId = targetChainId
    this.receiver = receiver
    this.data = data
    this.nonce = nonce
    this.reporters = reporters
    this.adapters = adapters
    this.threshold = threshold
  }

  static fromReceipt(_receipt: ContractReceipt) {
    let events = _receipt.events.filter(({ event }) => event === "MessageDispatched")
    if (events.length) {
      return events.map(({ args: { messageId, message } }) => new Message({ id: messageId, ...message }))
    }

    const abiCoder = new utils.AbiCoder()
    events = _receipt.events.filter(
      ({ topics }) => topics[0] === "0x218247aabc759e65b5bb92ccc074f9d62cd187259f2a0984c3c9cf91f67ff7cf",
    )
    return events.map(({ topics, data }) => {
      const message = abiCoder.decode(
        [
          {
            components: [
              {
                name: "nonce",
                type: "uint256",
              },
              {
                name: "targetChainId",
                type: "uint256",
              },
              {
                name: "threshold",
                type: "uint256",
              },
              {
                name: "sender",
                type: "address",
              },
              {
                name: "receiver",
                type: "address",
              },
              {
                name: "data",
                type: "bytes",
              },
              {
                name: "reporters",
                type: "address[]",
              },
              {
                name: "adapters",
                type: "address[]",
              },
            ],
            name: "message",
            type: "tuple",
          },
        ],
        data,
      )
      return new Message({ id: topics[1], ...message[0] })
    })
  }

  serialize() {
    return [
      this.nonce,
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
