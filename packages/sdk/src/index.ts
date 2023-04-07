import { Contract } from "ethers";
import { abi as HASHI_ABI } from "../../evm/artifacts/contracts/Hashi.sol/Hashi.json";

export const getMessageStatus = (
  hashiAddress: string,
  oracles: string[],
  messageId: string
) => {
  const hashi = new Contract(hashiAddress, HASHI_ABI);
  return hashi.populateTransaction.getHash(oracles, messageId);
};
