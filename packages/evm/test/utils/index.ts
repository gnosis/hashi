import { RLP, hexlify } from "ethers/lib/utils"
import { ethers, network } from "hardhat"

export const toBytes32 = (_n: number) => ethers.utils.hexZeroPad(ethers.utils.hexlify(_n), 32)

const emptyHexlify = (_value: string) => {
  const hex = ethers.utils.hexlify(_value, { hexPad: "left" })
  return hex === "0x00" ? "0x" : hex
}

export const blockRLP = (_block) => {
  const values = [
    _block.parentHash,
    _block.sha3Uncles,
    _block.miner,
    _block.stateRoot,
    _block.transactionsRoot,
    _block.receiptsRoot,
    _block.logsBloom,
    _block.difficulty,
    _block.number,
    _block.gasLimit,
    _block.gasUsed,
    _block.timestamp,
    _block.extraData,
    _block.mixHash,
    _block.nonce,
    _block.baseFeePerGas,
  ]
  return RLP.encode(values.map(emptyHexlify))
}

export const mine = async (_n: number) => await Promise.all([...Array(_n)].map(() => network.provider.send("evm_mine")))

export const getBlock = async (_blockNumber: number) => {
  const block = await ethers.provider.send("eth_getBlockByNumber", [hexlify(_blockNumber), false])
  return {
    ...block,
    _blockNumber,
  }
}
