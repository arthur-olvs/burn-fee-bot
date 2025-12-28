import { ethers } from "ethers";

export const erc20Abi = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)"
] as const;

export function erc20(address: string, signer: ethers.Signer) {
  return new ethers.Contract(address, erc20Abi, signer);
}
