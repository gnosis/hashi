import "dotenv/config"
import express from "express"
import bodyParser from "body-parser"
import { JSONRPCServer, TypedJSONRPCServer } from "json-rpc-2.0"
import { logger } from "@gnosis/hashi-common"

import logMiddleware from "./middlewares/log"
import getAccountAndStorageProof from "./methods/get-account-and-storage-proof"
import getReceiptProof from "./methods/get-receipt-proof"
import { Methods } from "./methods/types"

const start = async () => {
  const server: TypedJSONRPCServer<Methods> = new JSONRPCServer()
  server.addMethod("hashi_getAccountAndStorageProof", getAccountAndStorageProof)
  server.addMethod("hashi_getReceiptProof", getReceiptProof)
  server.applyMiddleware(logMiddleware)

  const app = express()
  app.use(bodyParser.json())

  app.post("/v1", (_req, _res) => {
    const jsonRPCRequest = _req.body
    server.receive(jsonRPCRequest).then((_jsonRPCResponse) => {
      if (_jsonRPCResponse) {
        _res.json(_jsonRPCResponse)
      } else {
        _res.sendStatus(204)
      }
    })
  })

  app.listen(process.env.PORT)
  logger.info(`Server listening on port ${process.env.PORT} ...`)
}

start()
