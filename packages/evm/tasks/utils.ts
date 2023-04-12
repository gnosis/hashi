import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import { AMBHeaderReporter__factory } from "../types"

/**
 * Decodes transaction calldata
 * Anatomy of a transaction calldata: 4 bytes <function selector> + abi encoded parameters
 * See https://www.quicknode.com/guides/ethereum-development/transactions/ethereum-transaction-calldata/ and
 * https://docs.soliditylang.org/en/v0.8.17/abi-spec.html#abi for more info.
 *
 * Usage: `yarn hardhat decode-function-data --calldata <calldata> --function <function name> --network chiado`
 *
 * Example: For AMBHeaderReporter contract deployed on Chiado (https://blockscout.com/gnosis/chiado/address/0xf2c4b937EEd174Ae08A84d568144E8B29B852F57),
 * we can check the calldata of tx (https://blockscout.com/gnosis/chiado/tx/0x190f875b1862694ca43b1fbf4b7cf89d04df407cc3a79eb591344d52959936f8)
 * and input it as a `calldata` parameter to the task.
 * `yarn hardhat decode-function-data --calldata 0x8ab3f27f00000000000000000000000000000000000000000000000000000000002c4b60000000000000000000000000871ee6f5df413e83427cab46e588f8b3e59474f700000000000000000000000000000000000000000000000000000000000f4240 --function reportHeader --network chiado`
 */
task("decode-tx-calldata")
  .addParam("function", "function name of tx")
  .addParam("calldata", "calldata of tx")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    if (taskArguments.function === "reportHeader") {
      const decodedData = ethers.utils.defaultAbiCoder.decode(
        ["uint256", "address", "uint256"],
        ethers.utils.hexDataSlice(taskArguments.calldata, 4),
      )
      console.log("decodedData", decodedData)
    }
  })
