import { ethers } from "ethers";
import { FEE_LOCKER } from "./chain.js";

export const feeLockerAbi = [
  "function availableFees(address feeOwner, address token) view returns (uint256)",
  "function claim(address feeOwner, address token) returns (uint256)"
] as const;

export function feeLockerContract(signer: ethers.Signer) {
  return new ethers.Contract(FEE_LOCKER, feeLockerAbi, signer);
}

// Robust claimed amount: sum Transfer(token -> feeOwner) in receipt
const transferIface = new ethers.Interface([
  "event Transfer(address indexed from, address indexed to, uint256 value)"
]);
const TRANSFER_TOPIC0 = ethers.id("Transfer(address,address,uint256)");

export function claimedAmountFromReceipt(
  receipt: ethers.TransactionReceipt,
  tokenAddr: string,
  toAddr: string
): bigint {
  const tokenLower = tokenAddr.toLowerCase();
  const toTopic = ethers.zeroPadValue(toAddr, 32).toLowerCase();
  let total = 0n;

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== tokenLower) continue;
    if ((log.topics?.[0] ?? "").toLowerCase() !== TRANSFER_TOPIC0.toLowerCase()) continue;
    if ((log.topics?.[2] ?? "").toLowerCase() !== toTopic) continue;

    try {
      const parsed = transferIface.parseLog(log);
      if (parsed) {
        total += parsed.args.value as bigint;
      }
    } catch {
      // ignore
    }
  }
  return total;
}
