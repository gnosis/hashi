import { decodeAbiParameters, Log } from "viem"

type Configs = {
  data: `0x${string}`
  sender: `0x${string}`
  threshold: bigint
  id: `0x${string}`
  receiver: `0x${string}`
  targetChainId: bigint
  nonce: bigint
  reporters: `0x${string}`[]
  adapters: `0x${string}`[]
}

class Message {
  public data: `0x${string}`
  public sender: `0x${string}`
  public threshold: bigint
  public id: `0x${string}`
  public receiver: `0x${string}`
  public targetChainId: bigint
  public nonce: bigint
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

  static fromLog(_log: Log) {
    const [values] = decodeAbiParameters(
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
      _log.data,
    )

    return new Message({
      id: _log.topics[1] as `0x${string}`,
      ...values,
    } as Configs)
  }

  serialize() {
    return [
      this.nonce.toString(),
      parseInt(this.targetChainId.toString()),
      parseInt(this.threshold.toString()),
      this.sender,
      this.receiver,
      this.data,
      this.reporters,
      this.adapters,
    ]
  }

  toJSON() {
    return {
      adapters: this.adapters,
      data: this.data,
      nonce: this.nonce.toString(),
      receiver: this.receiver,
      reporters: this.reporters,
      sender: this.sender,
      targetChainId: parseInt(this.targetChainId.toString()),
      threshold: parseInt(this.threshold.toString()),
    }
  }
}

export default Message
