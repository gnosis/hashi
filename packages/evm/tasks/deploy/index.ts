import { Contract } from "ethers"
import { HardhatRuntimeEnvironment } from "hardhat/types"

import "./hashi"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const verify = async (hre: HardhatRuntimeEnvironment, contract: Contract, constructorArguments: any = []) => {
  console.log("Waiting for 5 confirmations...")
  await contract.deployTransaction.wait(5)
  console.log("Verifying contract...")
  try {
    await hre.run("verify:verify", {
      address: contract.address,
      constructorArguments,
    })
  } catch (e) {
    if (
      e instanceof Error &&
      e.stack &&
      (e.stack.indexOf("Reason: Already Verified") > -1 ||
        e.stack.indexOf("Contract source code already verified") > -1)
    ) {
      console.log("Contract is already verified")
    } else {
      console.log(
        "Verifying the contract failed. This is probably because Etherscan is still indexing the contract. Try running this same command again in a few seconds.",
      )
      throw e
    }
  }
}
