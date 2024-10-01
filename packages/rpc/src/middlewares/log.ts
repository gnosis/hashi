import { JSONRPCRequest, JSONRPCResponse, JSONRPCServerMiddlewareNext } from "json-rpc-2.0"
import { logger } from "@gnosis/hashi-common"

const logMiddleware = (_next: JSONRPCServerMiddlewareNext<any>, _request: JSONRPCRequest, _params: any) => {
  logger.info(`Received ${JSON.stringify(_request)}`)
  return _next(_request, _params).then((_response: JSONRPCResponse | null) => {
    logger.info(`Responding ${JSON.stringify(_response)}`)
    return _response
  })
}

export default logMiddleware
