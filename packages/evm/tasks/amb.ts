import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import { AMBHeaderReporter__factory, contracts } from "../types"
import { ambMessageRelayerSol } from "../types/contracts/adapters/AMB"

/**
 * Usage: `yarn hardhat ambhr:reportheaders --network chiado`
 */
task("ambhr:reportheaders").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const signers: SignerWithAddress[] = await ethers.getSigners()
  const AMB_HEADER_REPORTER_ADDRESS = "0xf2c4b937EEd174Ae08A84d568144E8B29B852F57" // chiado
  const ambHeaderReporter = AMBHeaderReporter__factory.connect(AMB_HEADER_REPORTER_ADDRESS, signers[0])
  // TODO: report headers
  // await ambHeaderReporter.reportHeaders(...)
})

/**
 * Usage: `yarn hardhat ambhr:getters --network chiado`
 */
task("ambhr:getters").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const signers: SignerWithAddress[] = await ethers.getSigners()
  const AMB_HEADER_REPORTER_ADDRESS = "0xf2c4b937EEd174Ae08A84d568144E8B29B852F57" // chiado
  const ambHeaderReporter = AMBHeaderReporter__factory.connect(AMB_HEADER_REPORTER_ADDRESS, signers[0])
  console.log("amb: ", await ambHeaderReporter.amb())
  console.log("headerStorage: ", await ambHeaderReporter.headerStorage())
})
