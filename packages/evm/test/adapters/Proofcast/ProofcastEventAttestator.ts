import crypto from "crypto"
import { Event, Signature } from "ethers"
import { SigningKey } from "ethers/lib/utils"
import { ethers } from "hardhat"
import { RlpEncode, RlpList } from "rlp-stream"

import { Chains } from "../../utils/constants"

const sha256Digest = (_value: crypto.BinaryLike) => {
  const sha256 = crypto.createHash("sha256")
  sha256.update(_value)
  return sha256.digest()
}

type Context = {
  version: number
  protocolId: number
  chainId: number
}

const fromHex = (_0xString: string): Buffer => {
  return Buffer.from(_0xString.replace("0x", ""), "hex")
}

const formatSignature = (_signature: Signature): string => {
  const r = fromHex(_signature.r)
  const s = fromHex(_signature.s)
  const v = Buffer.from([_signature.v])
  const signature = Buffer.concat([r, s, v], r.length + s.length + v.length)
  return "0x" + signature.toString("hex")
}

class ProofcastEventAttestator {
  public version: Buffer
  public protocolId: Buffer
  public chainId: Buffer
  public address: string
  public publicKey: string
  private signingKey: SigningKey

  constructor({ version, protocolId, chainId }: Context = { version: 0x00, protocolId: 0x00, chainId: Chains.Goerli }) {
    this.version = Buffer.from([version])
    this.chainId = Buffer.from(chainId.toString(16).padStart(64, "0"), "hex")
    this.protocolId = Buffer.from([protocolId])
    this.signingKey = new ethers.utils.SigningKey(crypto.randomBytes(32))
    this.publicKey = this.signingKey.publicKey
    this.address = ethers.utils.computeAddress(this.publicKey)
  }

  getEventId(event: Event): Buffer {
    return sha256Digest(event.blockHash)
  }

  getStatementBytes(event: Event): Buffer {
    const address = fromHex(event.address)
    const data = fromHex(event.data)
    const topics: RlpList = event.topics.map((topic) => fromHex(topic))
    const eventRLP: RlpList = [address, topics, data]
    const eventBytes = RlpEncode(eventRLP)

    const eventId = this.getEventId(event)
    const length =
      this.version.length + this.protocolId.length + this.chainId.length + eventId.length + eventBytes.length

    return Buffer.concat([this.version, this.protocolId, this.chainId, eventId, eventBytes], length)
  }

  getStatement(event: Event): string {
    return "0x" + this.getStatementBytes(event).toString("hex")
  }

  getCommitmentBytes(event: Event): Buffer {
    const statement = this.getStatementBytes(event)
    return sha256Digest(statement)
  }

  getCommitment(event: Event): string {
    return "0x" + this.getCommitmentBytes(event).toString("hex")
  }

  signBytes(bytes: Buffer): string {
    const digest = sha256Digest(bytes)
    const signature = this.signingKey.signDigest(digest)

    return formatSignature(signature)
  }

  sign(event: Event): string {
    const commitment = this.getCommitmentBytes(event)
    const signature = this.signingKey.signDigest(commitment)

    return formatSignature(signature)
  }
}

export default ProofcastEventAttestator
