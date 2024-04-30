import { configDotenv } from "dotenv"
import { createWalletClient, http, Chain, publicActions, Log, Block } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import * as chains from "viem/chains"
import { MongoClient, Document } from "mongodb"

import { logger, Message } from "@gnosis/hashi-common"

import Batcher from "./Batcher"
import Watcher from "./Watcher"
import yahoAbi from "./abi/Yaho.json" assert { type: "json" }

configDotenv()

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

const watcher = new Watcher({
  logger,
  client,
  contractAddress: process.env.YAHO_ADDRESS as `0x${string}`,
  abi: yahoAbi,
  eventName: "MessageDispatched",
  watchIntervalTimeMs: Number(process.env.WATCH_INTERVAL_TIME_MS as string),
  onLogs: async (_logs: Log[]) => {
    // TODO: filter messages that you don't want to relay. For example it could be possible
    // to relayMessagesToAdapters only those coming from specific message.sender

    const blocks = (await Promise.all(
      _logs.map((_log: Log) => client.getBlock({ blockHash: _log.blockHash as `0x${string}` })),
    )) as Block[]
    const messages = _logs.map((_log: Log) => Message.fromLog(_log))

    await Promise.all(
      messages.map((_message: Message, _index: number) =>
        db.collection("messages").updateOne(
          { id: _message.id },
          {
            $set: {
              data: _message.toJSON(),
              status: "dispatched",
              chainId: client?.chain?.id as number,
              address: process.env.YAHO_ADDRESS as `0x${string}`,
              timestamp: parseInt(blocks[_index].timestamp.toString()),
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
  collection: db.collection("messages"),
  createBatchIntervalTimeMs: Number(process.env.CREATE_BATCH_INTERVAL_TIME_MS as string),
  finalStatus: "relayed",
  findCondition: {
    status: "dispatched",
    address: process.env.YAHO_ADDRESS as `0x${string}`,
  },
  logger,
  minBatchSize: Number(process.env.MIN_BATCH_SIZE as string),
  onBatch: async (_batch: Document[]) => {
    const serializedMessages = _batch.map((_val: any) =>
      new Message({
        id: _val.id,
        ..._val.data,
      }).serialize(),
    )

    logger.child({ service: "Relayer" }).info("Sending messages ...")
    const { request } = await client.simulateContract({
      address: process.env.YAHO_ADDRESS as `0x${string}`,
      abi: yahoAbi,
      functionName: "relayMessagesToAdapters",
      args: [serializedMessages],
    })
    const transactionHash = await client.writeContract(request)
    logger.child({ service: "Relayer" }).info(`Messages sent: ${transactionHash}`)

    return {
      transactionHash,
    }
  },
})
batcher.start()
