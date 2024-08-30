import "dotenv/config"
import { createWalletClient, http, Chain, publicActions, Log, createPublicClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import * as chains from "viem/chains"
import { MongoClient } from "mongodb"
import { adapterAbi, Batcher, logger, Message, Watcher, yahoAbi, yaruAbi } from "@gnosis/hashi-common"

const mongoClient = new MongoClient(process.env.MONGO_DB_URI as string)
await mongoClient.connect()
const db = mongoClient.db("hashi")

const sourceChain = Object.values(chains).find(({ id }) => id.toString() === (process.env.SOURCE_CHAIN_ID as string))
if (!sourceChain) throw new Error("Invalid SOURCE_CHAIN_ID")
const targetChain = Object.values(chains).find(({ id }) => id.toString() === (process.env.TARGET_CHAIN_ID as string))
if (!targetChain) throw new Error("Invalid TARGET_CHAIN_ID")

const sourceClient = createWalletClient({
  account: privateKeyToAccount(process.env.PK as `0x${string}`),
  chain: sourceChain as Chain | undefined,
  transport: http(process.env.SOURCE_RPC as string),
}).extend(publicActions)

const targetClient = createWalletClient({
  account: privateKeyToAccount(process.env.PK as `0x${string}`),
  chain: targetChain as Chain | undefined,
  transport: http(process.env.TARGET_RPC as string),
}).extend(publicActions)

const adapters = (process.env.ADAPTERS as string).split(",") as `0x${string}`[]
const watchers = adapters.map(
  (_adapter) =>
    new Watcher({
      abi: adapterAbi,
      client: targetClient,
      contractAddress: _adapter as `0x${string}`,
      eventName: "HashStored",
      logger,
      service: `ExecutorWatcher:${_adapter.slice(0, 6)}${_adapter.slice(_adapter.length - 4, _adapter.length)}`,
      watchIntervalTimeMs: Number(process.env.WATCH_INTERVAL_TIME_MS as string),
      onLogs: async (_logs: Log[]) => {
        const messageIds = _logs
          .map((_log) => _log.topics[1])
          .filter((id): id is `0x${string}` => id !== undefined) // Filter out undefined values
          .map((id) => BigInt(id)) // Convert each string to bigint

        // NOTE: without setting fromBlock and toBlock, it's not possible to getContractEvents
        const blockNumber = await sourceClient.getBlockNumber()
        const messageDispatchedLogs = await sourceClient.getContractEvents({
          abi: yahoAbi,
          address: process.env.SOURCE_YAHO_ADDRESS as `0x${string}`,
          eventName: "MessageDispatched",
          args: {
            messageId: messageIds,
          },
          fromBlock: blockNumber - BigInt(process.env.BLOCKS_WINDOW as string),
          toBlock: blockNumber,
          strict: true,
        })
        logger.info(`Found corresponding ${messageDispatchedLogs.length} message dispatch logs`)
        const messages = messageDispatchedLogs.map((_log) => Message.fromLog(_log))
        for (const message of messages) {
          const hashStoredLog = _logs.find((_log) => _log.topics[1] === message.id) as Log

          await db.collection("executedMessages").findOneAndUpdate(
            { id: message.id },
            {
              $addToSet: {
                confirmedBy: hashStoredLog.address,
              },
              $setOnInsert: {
                chainId: targetClient?.chain?.id as number,
                storeHashTransactionHash: hashStoredLog.transactionHash,
                status: "waitingForConfirmations",
                data: {
                  ...message.toJSON(),
                },
              },
            },
            { upsert: true, returnDocument: "after" },
          )
        }
      },
    }),
)
watchers.map((_watcher) => _watcher.start())

const batcher = new Batcher({
  createBatchIntervalTimeMs: Number(process.env.CREATE_BATCH_INTERVAL_TIME_MS as string),
  logger,
  minBatchSize: Number(process.env.MIN_BATCH_SIZE as string),
  service: "ExecutorBatcher",
  onGetValues: async () => {
    const values = await db
      .collection("executedMessages")
      .find({
        chainId: targetClient?.chain?.id as number,
        status: "waitingForConfirmations",
        $expr: { $gte: [{ $size: "$confirmedBy" }, "$threshold"] },
      })
      .toArray()

    const messages = values.map(
      (_val: any) =>
        new Message({
          id: _val.id,
          ..._val.data,
        }),
    )

    const executed = await Promise.all(
      messages.map((_message: Message) =>
        targetClient.readContract({
          address: process.env.TARGET_YARU_ADDRESS as `0x${string}`,
          abi: yaruAbi,
          functionName: "executed",
          args: [_message.id],
        }),
      ),
    )
    const messagesAlreadyExecuted = messages.filter((_, _index) => executed[_index])
    if (messagesAlreadyExecuted.length) {
      logger
        .child({ service: "Executor" })
        .info(`Found ${messagesAlreadyExecuted.length} messages already executed. Processing them ...`)
      // TODO: find the transactionHash
      await db
        .collection("executedMessages")
        .updateMany(
          { id: { $in: messages.map((_message: Message) => _message.id) } },
          { $set: { status: "alreadyExecuted" } },
        )
    }

    const messageToBeExecuted = messages.filter((_, _index) => !executed[_index])

    // NOTE: need to try one by one all messages in order to filter those that cannot be executed because the receiver contract reverts
    const messagesToBeExecuteWithoutRevert = []
    for (const message of messageToBeExecuted) {
      try {
        await targetClient.simulateContract({
          address: process.env.TARGET_YARU_ADDRESS as `0x${string}`,
          abi: yaruAbi,
          functionName: "executeMessages",
          args: [[message.serialize()]],
        })
        messagesToBeExecuteWithoutRevert.push(message)
      } catch (_err) {
        logger
          .child({ service: "Executor" })
          .info(`Message ${message.id} cannot be executed because it reverts. Skipping it ...`)
      }
    }
    return messagesToBeExecuteWithoutRevert
  },
  onBatch: async (_messages: Message[]) => {
    logger.child({ service: "Executor" }).info(`Executing ${_messages.length} messages ...`)
    const { request } = await targetClient.simulateContract({
      address: process.env.TARGET_YARU_ADDRESS as `0x${string}`,
      abi: yaruAbi,
      functionName: "executeMessages",
      args: [_messages.map((_message: Message) => _message.serialize())],
    })

    const transactionHash = await targetClient.writeContract({ ...request, gas: 1000000n })
    logger.child({ service: "Executor" }).info(`${_messages.length} messages executed: ${transactionHash}`)

    return {
      transactionHash,
      messages: _messages,
    }
  },
  onResult: (_result: any) => {
    const { messages, transactionHash } = _result as { messages: Message[]; transactionHash: string }

    return Promise.all(
      messages.map(({ id }) =>
        db.collection("executedMessages").updateOne(
          { id },
          {
            $set: { executeTransactionHash: transactionHash, status: "executed" },
          },
        ),
      ),
    )
  },
})
batcher.start()
