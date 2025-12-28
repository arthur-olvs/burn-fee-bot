import { ethers } from "ethers";

export const CHAIN_ID = 8453;

// Clanker Fee Locker v4 (Base)
export const FEE_LOCKER = "0xF3622742b1E446D92e45E22923Ef11C2fcD55D68";

// Base WETH
export const WETH = "0x4200000000000000000000000000000000000006";

export function makeProvider(url: string) {
  return new ethers.JsonRpcProvider(url);
}

export async function assertBase(provider: ethers.JsonRpcProvider) {
  const net = await provider.getNetwork();
  if (Number(net.chainId) !== CHAIN_ID) {
    throw new Error(`RPC não é Base mainnet. chainId=${net.chainId}`);
  }
}
