import { ethers } from "hardhat"

export const toBytes32 = (_n: number) => ethers.utils.hexZeroPad(ethers.utils.hexlify(_n), 32)
