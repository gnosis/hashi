import "dotenv/config"
import { createWalletClient, http, Chain, publicActions, Log } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import * as chains from "viem/chains"
import { MongoClient, Document } from "mongodb"
import { Batcher, logger, Message, Watcher, yahoAbi } from "@gnosis/hashi-common"

const chain = Object.values(chains).find(({ id }) => id.toString() === (process.env.CHAIN_ID as string))
if (!chain) throw new Error("Invalid CHAIN_ID")

const client = createWalletClient({
  account: privateKeyToAccount(process.env.PK as `0x${string}`),
  chain: chain as Chain | undefined,
  transport: http(process.env.RPC as string),
}).extend(publicActions)

const mongoClient = new MongoClient(process.env.MONGO_DB_URI as string)
await mongoClient.connect()
const db = mongoClient.db("hashi")

const whitelistedSenderAddresses = process.env.WHITELISTED_SENDER_ADDRESSES?.split(",").map((_address: string) =>
  _address.toLowerCase(),
) as string[]

const watcher = new Watcher({
  service: "RelayerWatcher",
  logger,
  client,
  contractAddress: process.env.YAHO_ADDRESS as `0x${string}`,
  abi: yahoAbi,
  eventName: "MessageDispatched",
  watchIntervalTimeMs: Number(process.env.WATCH_INTERVAL_TIME_MS as string),
  onLogs: async (_logs: Log[]) => {
    let messages = _logs.map((_log: Log) => Message.fromLog(_log))
    if (whitelistedSenderAddresses.length) {
      logger.child({ service: "Relayer" }).info(`Filtering messages ...`)
      messages = messages.filter((_message) => whitelistedSenderAddresses.includes(_message.sender.toLowerCase()))
    }

    await Promise.all(
      messages.map((_message: Message, _index: number) =>
        db.collection("relayedMessages").updateOne(
          { id: _message.id },
          {
            $set: {
              address: process.env.YAHO_ADDRESS as `0x${string}`,
              chainId: client?.chain?.id as number,
              data: _message.toJSON(),
              dispatchTransactionHash: _logs[_index].transactionHash,
              status: "dispatched",
            },
          },
          {
            upsert: true,
          },
        ),
      ),
    )
  },
})
watcher.start()

const batcher = new Batcher({
  service: "RelayerBatcher",
  createBatchIntervalTimeMs: Number(process.env.CREATE_BATCH_INTERVAL_TIME_MS as string),
  logger,
  minBatchSize: Number(process.env.MIN_BATCH_SIZE as string),
  onGetValues: () => {
    return db
      .collection("relayedMessages")
      .find({
        status: "dispatched",
        address: process.env.YAHO_ADDRESS as `0x${string}`,
      })
      .toArray()
  },
  onBatch: async (_batch: Document[]) => {
    const messages = _batch.map(
      (_val: any) =>
        new Message({
          id: _val.id,
          ..._val.data,
        }),
    )
    const serializedMessages = messages.map((_message: Message) => _message.serialize())

    logger.child({ service: "Relayer" }).info(`Relaying ${serializedMessages.length} messages ...`)
    const { request } = await client.simulateContract({
      address: process.env.YAHO_ADDRESS as `0x${string}`,
      abi: yahoAbi,
      functionName: "relayMessagesToAdapters",
      args: [serializedMessages],
    })
    const transactionHash = await client.writeContract(request)
    logger.child({ service: "Relayer" }).info(`${serializedMessages.length} messages relayed: ${transactionHash}`)

    return {
      messages,
      transactionHash,
    }
  },
  onResult: (_result: any) => {
    const { messages, transactionHash } = _result as { messages: Message[]; transactionHash: string }

    return Promise.all(
      messages.map(({ id }) =>
        db.collection("relayedMessages").updateOne(
          { id },
          {
            $set: { relayTransactionHash: transactionHash, status: "relayed" },
          },
        ),
      ),
    )
  },
})
batcher.start()
